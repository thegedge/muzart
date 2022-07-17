import { padStart, range, zip } from "lodash";
import {
  AccentStyle,
  Bend,
  BendType,
  ChordDiagram,
  HarmonicStyle,
  Measure,
  Note,
  NoteDynamic,
  NoteOptions,
  Pitch,
  Score,
  SlideType,
  TimeSignature,
} from "../notation";
import { NoteValue } from "../notation/note_value";
import { BufferCursor, NumberType } from "./util/BufferCursor";

// TODO different versions

const debug = process.env.NODE_ENV == "development";

enum Version {
  v4_06,
}

// Implemented with help from http://dguitar.sourceforge.net/GP4format.html (some adjustments, it's not totally correct)

export default function load(source: ArrayBuffer): Score {
  const cursor = new BufferCursor(source);

  //------------------------------------------------------------------------------------------------
  // Song attributes
  //------------------------------------------------------------------------------------------------

  /* const version = */ readVersion(cursor);

  debug && console.debug("tab info");
  const tabInformation = {
    title: readInfoString(cursor),
    subtitle: readInfoString(cursor),
    artist: readInfoString(cursor),
    album: readInfoString(cursor),
    composer: readInfoString(cursor),
    copyright: readInfoString(cursor),
    transcriber: readInfoString(cursor),
    instructions: readInfoString(cursor),
  };
  debug && console.debug({ tabInformation });

  debug && console.debug("comments");
  const comments = readComments(cursor);
  debug && console.debug({ comments });

  /* const tripletFeel = */ cursor.nextNumber(NumberType.Uint8);

  debug && console.debug("lyrics");
  readLyrics(cursor);

  const tempo = cursor.nextNumber(NumberType.Uint32);
  /* const key = */ cursor.nextNumber(NumberType.Uint8);
  /* const octave = */ cursor.nextNumber(NumberType.Uint32);

  debug && console.debug("midi channels");
  const midiPorts = readMidiChannels(cursor);

  const numMeasures = cursor.nextNumber(NumberType.Uint32);
  const numTracks = cursor.nextNumber(NumberType.Uint32);

  const score: Score = {
    parts: [],
    comments,
    ...tabInformation,
  };

  //------------------------------------------------------------------------------------------------
  // Measure props
  //------------------------------------------------------------------------------------------------

  const measureData = range(numMeasures).map((index) => {
    debug && console.debug({ measureDataIndex: index });

    const [
      _doubleBar,
      hasKeySignature,
      hasMarker,
      hasAlternateEnding,
      hasEndOfRepeat,
      _startOfRepeat,
      hasTimeSignatureDenominator,
      hasTimeSignatureNumerator,
    ] = bits(cursor.nextNumber(NumberType.Uint8));

    let numerator, denominator;
    if (hasTimeSignatureNumerator) {
      numerator = cursor.nextNumber(NumberType.Uint8);
    }

    if (hasTimeSignatureDenominator) {
      denominator = cursor.nextNumber(NumberType.Uint8);
    }

    let timeSignature;
    if (numerator && denominator) {
      timeSignature = new TimeSignature(NoteValue.fromNumber(denominator), numerator);
    }

    if (hasEndOfRepeat) {
      /* const numRepeats = */ cursor.nextNumber(NumberType.Uint8);
    }

    if (hasAlternateEnding) {
      /* const alternateEnding = */ cursor.nextNumber(NumberType.Uint8);
    }

    let marker;
    if (hasMarker) {
      const name = cursor.nextLengthPrefixedString(NumberType.Uint32);
      const color = readColor(cursor);
      marker = {
        text: name,
        color,
      };
    }

    if (hasKeySignature) {
      /* const alterations = */ cursor.nextNumber(NumberType.Uint8);
      /* const minor = */ cursor.nextNumber(NumberType.Uint8);
    }

    return { marker, timeSignature };
  });

  //------------------------------------------------------------------------------------------------
  // Track props
  //------------------------------------------------------------------------------------------------

  const trackData = range(numTracks).map((index) => {
    debug && console.debug({ trackDataIndex: index });

    const [_blank1, _blank2, _blank3, _blank4, _blank5, _banjoTrack, _twelveStringTrack, _drumsTrack] = bits(
      cursor.nextNumber(NumberType.Uint8)
    );

    const name = cursor.nextLengthPrefixedString(NumberType.Uint8);
    cursor.skip(40 - name.length);

    const numStrings = cursor.nextNumber(NumberType.Uint32);
    const stringTuning = range(7)
      .map(() => {
        const value = cursor.nextNumber(NumberType.Uint32);
        return Pitch.fromMidi(value);
      })
      .slice(0, numStrings);

    const midiPort = cursor.nextNumber(NumberType.Uint32);
    const midiChannel = cursor.nextNumber(NumberType.Uint32);
    /* const midiChannelEffects = */ cursor.nextNumber(NumberType.Uint32);
    /* const numberOfFrets = */ cursor.nextNumber(NumberType.Uint32);
    /* const capoFret = */ cursor.nextNumber(NumberType.Uint32);
    /* const color = */ cursor.nextNumber(NumberType.Uint32);

    score.parts.push({
      name,
      lineCount: numStrings,
      measures: [],
      instrument: {
        midiPreset: midiPorts[midiPort - 1][midiChannel - 1] ?? 24,
        tuning: stringTuning,
      },
    });

    return {
      numStrings,
      stringTuning,
    };
  });

  //------------------------------------------------------------------------------------------------
  // Track/measure beats
  //------------------------------------------------------------------------------------------------

  for (let measureIndex = 0; measureIndex < numMeasures; ++measureIndex) {
    for (let trackIndex = 0; trackIndex < numTracks; ++trackIndex) {
      debug && console.debug({ trackIndex, measureIndex });

      const measure: Measure = {
        chords: [],
        number: measureIndex + 1,
        marker: measureData[measureIndex].marker,
        staffDetails: {},
      };

      let measureTempo;

      const numBeats = cursor.nextNumber(NumberType.Uint32);
      for (let beat = 0; beat < numBeats; ++beat) {
        const [_blank1, hasStatus, hasTuplet, hasMixTableChangeEvent, hasEffects, hasText, hasChordDiagram, dotted] =
          bits(cursor.nextNumber(NumberType.Uint8));

        let rest = false;
        if (hasStatus) {
          const status = cursor.nextNumber(NumberType.Uint8);
          rest = status == 0x02;
        }

        let duration = NoteValue.fromNumber(1 << (cursor.nextNumber(NumberType.Int8) + 2));
        if (dotted) {
          duration = duration.dot();
        }

        if (hasTuplet) {
          const n = cursor.nextNumber(NumberType.Uint32);

          // TODO actual is derived for simple metre here, but will need to eventual deal with compound
          let actual = 1;
          while (2 * actual < n) {
            actual <<= 1;
          }
          duration = duration.withTuplet({ n, actual });
        }

        let chordDiagram;
        if (hasChordDiagram) {
          chordDiagram = readChordDiagram(cursor);
        }

        let text;
        if (hasText) {
          text = cursor.nextLengthPrefixedString(NumberType.Uint32);
        }

        if (hasEffects) {
          const [
            _blank1,
            hasStroke,
            hasTapping,
            _blank2,
            _hasArtificialHarmonic_v3,
            _hasNaturalHarmonic_v3,
            _vibrato_v3,
            _wideVibrato_v3,
          ] = bits(cursor.nextNumber(NumberType.Uint8));

          const [_blank2_1, _blank2_2, _blank2_3, _blank2_4, _blank2_5, hasTremolo, hasPickstroke, _hasRasguedo] = bits(
            cursor.nextNumber(NumberType.Uint8)
          );

          if (hasTapping) {
            /* const effect = */ cursor.nextNumber(NumberType.Uint8);
          }

          if (hasTremolo) {
            /* const effect = */ readBend(cursor);
          }

          if (hasStroke) {
            /* const downStrokeDuration = */ cursor.nextNumber(NumberType.Uint8);
            /* const upStrokeDuration = */ cursor.nextNumber(NumberType.Uint8);
          }

          if (hasPickstroke) {
            /* const strokeDirection = */ cursor.nextNumber(NumberType.Uint8);
          }
        }

        if (hasMixTableChangeEvent) {
          /* const instrument = */ cursor.nextNumber(NumberType.Int8);
          const volume = cursor.nextNumber(NumberType.Int8);
          const pan = cursor.nextNumber(NumberType.Int8);
          const chorus = cursor.nextNumber(NumberType.Int8);
          const reverb = cursor.nextNumber(NumberType.Int8);
          const phaser = cursor.nextNumber(NumberType.Int8);
          const tremolo = cursor.nextNumber(NumberType.Int8);
          const tempo = cursor.nextNumber(NumberType.Int32);
          if (volume !== -1) {
            /* const volumeChangeDuration = */ cursor.nextNumber(NumberType.Uint8);
          }
          if (pan !== -1) {
            /* const panChangeDuration = */ cursor.nextNumber(NumberType.Uint8);
          }
          if (chorus !== -1) {
            /* const chorusChangeDuration = */ cursor.nextNumber(NumberType.Uint8);
          }
          if (reverb !== -1) {
            /* const reverbChangeDuration = */ cursor.nextNumber(NumberType.Uint8);
          }
          if (phaser !== -1) {
            /* const phaserChangeDuration = */ cursor.nextNumber(NumberType.Uint8);
          }
          if (tremolo !== -1) {
            /* const tremoloChangeDuration = */ cursor.nextNumber(NumberType.Uint8);
          }
          if (tempo !== -1) {
            /* const tempoChangeDuration = */ cursor.nextNumber(NumberType.Uint8);
            measureTempo = tempo;

            // TODO need to track the beats, if the value isn't 0
          }

          const [_blank1, _blank2, _tremoloAll, _phaserAll, _reverbAll, _chorusAll, _panAll, _volumeAll] = bits(
            cursor.nextNumber(NumberType.Uint8)
          );
        }

        // Max 7 strings, so git rid of the unused, most-significant bit
        const strings = bits(cursor.nextNumber(NumberType.Uint8)).slice(1);
        const notes = [];
        for (let string = 0; string < trackData[trackIndex].numStrings; ++string) {
          if (strings[string]) {
            const noteOptions = readNote(cursor, trackData[trackIndex].stringTuning[string], duration);
            noteOptions.placement ??= { fret: 0, string };
            noteOptions.placement.string = string + 1;
            notes.push(new Note(noteOptions));
          }
        }

        measure.staffDetails.tempo = { value: measureTempo || tempo, changed: true };

        const newTimeSignature = measureData[measureIndex].timeSignature;
        if (newTimeSignature) {
          measure.staffDetails.time = { value: newTimeSignature, changed: true };
        }

        measure.chords.push({ notes, chordDiagram, text, value: duration, rest });
      }

      score.parts[trackIndex].measures.push(measure);
    }
  }

  // TODO chord diagrams

  return score;
}

function readNote(cursor: BufferCursor, stringTuning: Pitch, defaultNoteValue: NoteValue) {
  const [
    hasFingering,
    isAccentuated,
    _hasNoteType,
    hasNoteDynamic,
    hasNoteEffects,
    isGhostNote,
    _isDottedNote,
    hasDuration,
  ] = bits(cursor.nextNumber(NumberType.Uint8));

  // 1 = normal note
  // 2 = tie (link with previous)
  // 3 = dead note
  const variant = cursor.nextNumber(NumberType.Uint8);

  let duration = 0;
  if (hasDuration) {
    const durationType = cursor.nextNumber(NumberType.Int8);
    // -2 = whole note, -1 = half note, ...
    if (durationType < -2 || durationType > 4) {
      throw new Error(`unexpected duration: ${durationType}`);
    }

    duration = 1 << (4 - Math.max(4, durationType)); // TODO understand the max duration
    /* const tuplet = */ cursor.nextNumber(NumberType.Uint8);
  }

  let dynamic;
  if (hasNoteDynamic) {
    const dynamicValue = cursor.nextNumber(NumberType.Uint8);
    switch (dynamicValue) {
      case 1:
        dynamic = NoteDynamic.Pianississimo;
        break;
      case 2:
        dynamic = NoteDynamic.Pianissimo;
        break;
      case 3:
        dynamic = NoteDynamic.Piano;
        break;
      case 4:
        dynamic = NoteDynamic.MezzoPiano;
        break;
      case 5:
        dynamic = NoteDynamic.MezzoForte;
        break;
      case 6:
        dynamic = NoteDynamic.Forte;
        break;
      case 7:
        dynamic = NoteDynamic.Fortissimo;
        break;
      case 8:
        dynamic = NoteDynamic.Fortississimo;
        break;
      default:
        console.warn(`Unknown dynamic value: ${dynamicValue}`);
        break;
    }
  }

  const fret = cursor.nextNumber(NumberType.Uint8);

  // options initialized here because pitch/value have to be defined
  const options: NoteOptions = {
    pitch: stringTuning.adjust(fret),
    value: duration == 0 ? defaultNoteValue : NoteValue.fromNumber(duration),
    dead: variant === 3,
    tie: variant === 2 ? { type: "stop" } : undefined,
    ghost: isGhostNote,
    accent: isAccentuated ? AccentStyle.Accentuated : undefined,
    dynamic,
    placement: {
      fret,
      string: 0,
    },
  };

  if (hasFingering) {
    /* const leftHandFingering = */ cursor.nextNumber(NumberType.Uint8);
    /* const rightHandFingering = */ cursor.nextNumber(NumberType.Uint8);
  }

  if (hasNoteEffects) {
    const [_blank1, _blank2, _blank3, hasGraceNote, letRing, _hasSlide_v3, _isHammerOnPullOff, hasBend] = bits(
      cursor.nextNumber(NumberType.Uint8)
    );

    const [_blank2_1, leftHandVibrato, hasTrill, hasHarmonics, hasSlide, hasTremoloPicking, isPalmMute, isStaccato] =
      bits(cursor.nextNumber(NumberType.Uint8));

    options.letRing = letRing;
    options.palmMute = isPalmMute;
    options.staccato = isStaccato;
    options.vibrato = leftHandVibrato;

    if (hasBend) {
      options.bend = readBend(cursor);
    }

    if (hasGraceNote) {
      /* const fret = */ cursor.nextNumber(NumberType.Uint8);
      /* const dynamic = */ cursor.nextNumber(NumberType.Uint8);
      /* const transition = */ cursor.nextNumber(NumberType.Uint8);
      /* const duration = */ cursor.nextNumber(NumberType.Uint8);
    }

    if (hasTremoloPicking) {
      /* const tremoloDuration = */ cursor.nextNumber(NumberType.Uint8);
    }

    if (hasSlide) {
      const slideStyle = cursor.nextNumber(NumberType.Int8);

      let type, upwards;
      switch (slideStyle) {
        case -2:
          type = SlideType.SlideIntoFromAbove;
          upwards = false;
          break;
        case -1:
          type = SlideType.SlideIntoFromBelow;
          upwards = true;
          break;
        case 0:
          // no slide
          break;
        case 1:
          type = SlideType.ShiftSlide;
          upwards = true; // will be figured out in postprocess
          break;
        case 2:
          type = SlideType.LegatoSlide;
          upwards = true; // will be figured out in postprocess
          break;
        case 3:
          type = SlideType.SlideOutDownwards;
          upwards = false;
          break;
        case 4:
          type = SlideType.SlideOutUpwards;
          upwards = true;
          break;
      }

      if (type) {
        options.slide = { type, upwards: !!upwards };
      }
    }

    if (hasHarmonics) {
      const harmonicStyle = cursor.nextNumber(NumberType.Uint8);
      switch (harmonicStyle) {
        case 0:
          break;
        case 1:
          options.harmonic = HarmonicStyle.Natural;
          break;
        case 3:
          options.harmonic = HarmonicStyle.Tapped;
          break;
        case 4:
          options.harmonic = HarmonicStyle.Pitch;
          break;
        case 5:
          options.harmonic = HarmonicStyle.Semi;
          break;
        case 15:
          options.harmonic = HarmonicStyle.ArtificialPlus5;
          break;
        case 17:
          options.harmonic = HarmonicStyle.ArtificialPlus7;
          break;
        case 22:
          options.harmonic = HarmonicStyle.ArtificialPlus12;
          break;
        default:
          console.warn(`Unknown harmonic style: ${harmonicStyle}`);
      }
    }

    if (hasTrill) {
      /* const fret = */ cursor.nextNumber(NumberType.Uint8);
      /* const period = */ cursor.nextNumber(NumberType.Uint8);
    }
  }

  return options;
}

function readChordDiagram(cursor: BufferCursor): ChordDiagram {
  /* const version */ cursor.nextNumber(NumberType.Uint8);
  /* const sharp = */ cursor.nextNumber(NumberType.Uint8);

  /* const blank1 = */ cursor.nextNumber(NumberType.Uint8);
  /* const blank2 = */ cursor.nextNumber(NumberType.Uint8);
  /* const blank3 = */ cursor.nextNumber(NumberType.Uint8);

  /* const root = */ cursor.nextNumber(NumberType.Uint8);
  /* const majorMinor = */ cursor.nextNumber(NumberType.Uint8);
  /* const nineElevenThirteen = */ cursor.nextNumber(NumberType.Uint8);
  /* const bass = */ cursor.nextNumber(NumberType.Uint32);
  /* const diminishedAugmented = */ cursor.nextNumber(NumberType.Uint32);
  /* const add = */ cursor.nextNumber(NumberType.Uint8);

  const name = cursor.nextLengthPrefixedString();
  cursor.skip(20 - name.length);

  /* const blank4 = */ cursor.nextNumber(NumberType.Uint8);
  /* const blank5 = */ cursor.nextNumber(NumberType.Uint8);

  /* const fifth = */ cursor.nextNumber(NumberType.Uint8);
  /* const ninth = */ cursor.nextNumber(NumberType.Uint8);
  /* const eleventh = */ cursor.nextNumber(NumberType.Uint8);

  const baseFret = cursor.nextNumber(NumberType.Uint32);

  const frets = [
    cursor.nextNumber(NumberType.Int32),
    cursor.nextNumber(NumberType.Int32),
    cursor.nextNumber(NumberType.Int32),
    cursor.nextNumber(NumberType.Int32),
    cursor.nextNumber(NumberType.Int32),
    cursor.nextNumber(NumberType.Int32),
    cursor.nextNumber(NumberType.Int32),
  ];

  const numBarres = cursor.nextNumber(NumberType.Uint8);

  const barreFrets = [
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
  ];

  const barreStarts = [
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
  ];

  const barreEnds = [
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
    cursor.nextNumber(NumberType.Uint8),
  ];

  /* const omission1 = */ cursor.nextNumber(NumberType.Uint8);
  /* const omission3 = */ cursor.nextNumber(NumberType.Uint8);
  /* const omission5 = */ cursor.nextNumber(NumberType.Uint8);
  /* const omission7 = */ cursor.nextNumber(NumberType.Uint8);
  /* const omission9 = */ cursor.nextNumber(NumberType.Uint8);
  /* const omission11 = */ cursor.nextNumber(NumberType.Uint8);
  /* const omission13 = */ cursor.nextNumber(NumberType.Uint8);

  /* const blank6 = */ cursor.nextNumber(NumberType.Uint8);

  /* const fingering1 = */ cursor.nextNumber(NumberType.Uint8);
  /* const fingering2 = */ cursor.nextNumber(NumberType.Uint8);
  /* const fingering3 = */ cursor.nextNumber(NumberType.Uint8);
  /* const fingering4 = */ cursor.nextNumber(NumberType.Uint8);
  /* const fingering5 = */ cursor.nextNumber(NumberType.Uint8);
  /* const fingering6 = */ cursor.nextNumber(NumberType.Uint8);
  /* const fingering7 = */ cursor.nextNumber(NumberType.Uint8);

  /* const showDiagonalFingering = */ cursor.nextNumber(NumberType.Uint8);

  let diagram: ChordDiagram["diagram"];
  if (numBarres > 0 || frets.some((v) => v != -1)) {
    diagram = {
      baseFret,
      frets,
      barres: zip(barreFrets, barreStarts, barreEnds)
        .slice(0, numBarres)
        .map(([fret, start, end]) => ({
          baseFret: fret || 1,
          firstString: start || 0,
          lastString: end || 0,
        })),
    };
  }

  return {
    name,
    diagram,
  };
}

function bits(byte: number): boolean[] {
  return [
    (byte & 0b10000000) === 0b10000000,
    (byte & 0b01000000) === 0b01000000,
    (byte & 0b00100000) === 0b00100000,
    (byte & 0b00010000) === 0b00010000,
    (byte & 0b00001000) === 0b00001000,
    (byte & 0b00000100) === 0b00000100,
    (byte & 0b00000010) === 0b00000010,
    (byte & 0b00000001) === 0b00000001,
  ];
}

function readComments(cursor: BufferCursor) {
  const numCommentLines = cursor.nextNumber(NumberType.Uint32);
  debug && console.debug({ numCommentLines });
  return range(numCommentLines).map(() => {
    return cursor.nextLengthPrefixedString(NumberType.Uint32);
  });
}

function readLyrics(cursor: BufferCursor) {
  /* const track = */ cursor.nextNumber(NumberType.Uint32);
  for (let i = 0; i < 5; ++i) {
    /* const startFromBar = */ cursor.nextNumber(NumberType.Uint32);
    /* const line = */ cursor.nextLengthPrefixedString(NumberType.Uint32);
  }
}

function readMidiChannels(cursor: BufferCursor) {
  const ports = [];

  for (let port = 1; port <= 4; ++port) {
    const channels = [];
    for (let channel = 1; channel <= 16; ++channel) {
      const instrument = cursor.nextNumber(NumberType.Uint32);
      /* const volume = */ cursor.nextNumber(NumberType.Uint8);
      /* const balance = */ cursor.nextNumber(NumberType.Uint8);
      /* const chorus = */ cursor.nextNumber(NumberType.Uint8);
      /* const reverb = */ cursor.nextNumber(NumberType.Uint8);
      /* const phaser = */ cursor.nextNumber(NumberType.Uint8);
      /* const tremolo = */ cursor.nextNumber(NumberType.Uint8);
      /* const blank1 = */ cursor.nextNumber(NumberType.Uint8);
      /* const blank2 = */ cursor.nextNumber(NumberType.Uint8);

      channels.push(instrument);
    }

    ports.push(channels);
  }

  return ports;
}

function readBend(cursor: BufferCursor): Bend | undefined {
  let type: BendType;
  const bendTypeValue = cursor.nextNumber(NumberType.Uint8);
  switch (bendTypeValue) {
    case 0:
      // None?
      return;
    case 1:
      type = BendType.Bend;
      break;
    case 2:
      type = BendType.BendRelease;
      break;
    case 3:
      type = BendType.BendReleaseBend;
      break;
    case 4:
      type = BendType.Prebend;
      break;
    case 5:
      type = BendType.PrebendRelease;
      break;
    case 6:
      type = BendType.Dip;
      break;
    case 7:
      type = BendType.Dive;
      break;
    case 8:
      type = BendType.ReleaseUp;
      break;
    case 9:
      type = BendType.InvertedDip;
      break;
    case 10:
      type = BendType.Return;
      break;
    case 11:
      type = BendType.ReleaseDown;
      break;
    default:
      throw new Error(`Unknown bend type value: ${bendTypeValue}`);
  }

  const amplitude = cursor.nextNumber(NumberType.Uint32) / 100.0;
  const numPoints = cursor.nextNumber(NumberType.Uint32);
  const points = range(numPoints).map((_) => {
    const time = cursor.nextNumber(NumberType.Uint32) / 60.0;
    const amplitude = cursor.nextNumber(NumberType.Uint32) / 100.0;

    // 0 = none, 1 = fast, 2 = average, 3 = slow
    const vibrato = cursor.nextNumber(NumberType.Uint8);

    return { time, amplitude, vibrato };
  });

  return {
    type,
    amplitude,
    points,
  };
}

function readColor(cursor: BufferCursor): string {
  const _ = cursor.nextNumber(NumberType.Uint8);
  const b = cursor.nextNumber(NumberType.Uint8);
  const g = cursor.nextNumber(NumberType.Uint8);
  const r = cursor.nextNumber(NumberType.Uint8);
  const c = padStart(((r << 16) | (g << 8) | b).toString(16), 6, "0");
  return `#${c}`;
}

function readInfoString(cursor: BufferCursor): string {
  const length = cursor.nextNumber(NumberType.Uint32) - 1;
  cursor.skip(); // some extra byte that appears to be the length of the string???
  if (length <= 0) {
    return "";
  } else {
    return cursor.nextString(length);
  }
}

function readVersion(cursor: BufferCursor) {
  const version = cursor.nextLengthPrefixedString();
  try {
    switch (version) {
      case "FICHIER GUITAR PRO v4.06":
        return Version.v4_06;
      default:
        throw new Error(`Unsupported Guitar Pro version: ${version}`);
    }
  } finally {
    cursor.skip(30 - version.length);
    debug && console.debug({ version });
  }
}
