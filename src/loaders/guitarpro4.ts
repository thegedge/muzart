import { range } from "lodash";
import { Measure, Note, Pitch, Score } from "../notation";
import { BufferCursor, NumberType } from "../util/BufferCursor";

// TODO different versions

// Implemented with help from http://dguitar.sourceforge.net/GP4format.html (some adjustments, it's not totally correct)

export default function load(source: ArrayBuffer): Score {
  const cursor = new BufferCursor(source);

  //------------------------------------------------------------------------------------------------
  // Song attributes
  //------------------------------------------------------------------------------------------------

  const version = cursor.nextLengthPrefixedString();
  cursor.skip(30 - version.length);

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

  readComments(cursor);

  /* const tripletFeel = */ cursor.nextNumber(NumberType.Uint8);

  readLyrics(cursor);

  /* const tempo = */ cursor.nextNumber(NumberType.Uint32);
  /* const key = */ cursor.nextNumber(NumberType.Uint8);
  /* const octave = */ cursor.nextNumber(NumberType.Uint32);

  readMidiChannels(cursor);

  const numMeasures = cursor.nextNumber(NumberType.Uint32);
  const numTracks = cursor.nextNumber(NumberType.Uint32);

  const score: Score = {
    parts: [],
    ...tabInformation,
  };

  //------------------------------------------------------------------------------------------------
  // Measure props
  //------------------------------------------------------------------------------------------------

  for (let measure = 0; measure < numMeasures; ++measure) {
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

    if (hasTimeSignatureNumerator) {
      /* const numerator = */ cursor.nextNumber(NumberType.Uint8);
    }

    if (hasTimeSignatureDenominator) {
      /* const denominator = */ cursor.nextNumber(NumberType.Uint8);
    }

    if (hasEndOfRepeat) {
      /* const numRepeats = */ cursor.nextNumber(NumberType.Uint8);
    }

    if (hasAlternateEnding) {
      /* const alternateEnding = */ cursor.nextNumber(NumberType.Uint8);
    }

    if (hasMarker) {
      /* const name = */ cursor.nextLengthPrefixedString(NumberType.Uint32);
      /* const color = */ cursor.nextNumber(NumberType.Uint32);
    }

    if (hasKeySignature) {
      /* const alterations = */ cursor.nextNumber(NumberType.Uint8);
      /* const minor = */ cursor.nextNumber(NumberType.Uint8);
    }
  }

  //------------------------------------------------------------------------------------------------
  // Track props
  //------------------------------------------------------------------------------------------------

  const trackData = range(numTracks).map(() => {
    const [_blank1, _blank2, _blank3, _blank4, _blank5, _banjoTrack, _twelveStringTrack, _drumsTrack] = bits(
      cursor.nextNumber(NumberType.Uint8)
    );

    const name = cursor.nextLengthPrefixedString(NumberType.Uint8);
    cursor.skip(40 - name.length);

    const numStrings = cursor.nextNumber(NumberType.Uint32);
    const stringTuning = range(7)
      .map(() => {
        return Pitch.fromInt(cursor.nextNumber(NumberType.Uint32));
      })
      .slice(0, numStrings);

    /* const midiPort = */ cursor.nextNumber(NumberType.Uint32);
    /* const midiChannel = */ cursor.nextNumber(NumberType.Uint32);
    /* const midiChannelEffects = */ cursor.nextNumber(NumberType.Uint32);
    /* const numberOfFrets = */ cursor.nextNumber(NumberType.Uint32);
    /* const capoFret = */ cursor.nextNumber(NumberType.Uint32);
    /* const color = */ cursor.nextNumber(NumberType.Uint32);

    score.parts.push({
      measures: [],
      name,
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
      const measure: Measure = {
        chords: [],
        staveDetails: [
          {
            // TODO more divisions, but for now 6 to support durations from -2 (whole) to 64th (4)
            divisions: 1 << 6,
            lineCount: trackData[trackIndex].numStrings,
            tuning: trackData[trackIndex].stringTuning,
          },
        ],
      };

      const numBeats = cursor.nextNumber(NumberType.Uint32);
      for (let beat = 0; beat < numBeats; ++beat) {
        const [
          _blank1,
          hasStatus,
          hasTuplet,
          hasMixTableChangeEvent,
          hasEffects,
          hasText,
          hasChordDiagram,
          _dotted,
        ] = bits(cursor.nextNumber(NumberType.Uint8));

        if (hasStatus) {
          /* const status = */ cursor.nextNumber(NumberType.Uint8);
          // TODO empty if 0x00, rest if 0x02
        }

        const duration = cursor.nextNumber(NumberType.Int8);

        if (hasTuplet) {
          /* const n = */ cursor.nextNumber(NumberType.Uint32);
        }

        if (hasChordDiagram) {
          /* const diagram = */ readChordDiagram(cursor);
        }

        if (hasText) {
          /* const text = */ cursor.nextLengthPrefixedString(NumberType.Uint32);
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
          }

          const [_blank1, _blank2, _tremoloAll, _phaserAll, _reverbAll, _chorusAll, _panAll, _volumeAll] = bits(
            cursor.nextNumber(NumberType.Uint8)
          );
        }

        // Max 7 strings, so git rid of the unused, most-significant bit
        let foo;
        const strings = (foo = bits(cursor.nextNumber(NumberType.Uint8))).slice(1);
        const chord = [];
        for (let string = 0; string < trackData[trackIndex].numStrings; ++string) {
          if (strings[string]) {
            const note = readNote(cursor);
            if (note.duration === 0) {
              note.duration = 1 << Math.max(6, duration + 2);
            }

            note.placement ??= { fret: 0, string };
            note.placement.string = string + 1;

            // TODO pitch based on string/fret and track tuning

            chord.push(note);
          }
        }

        measure.chords.push(chord);
      }

      score.parts[trackIndex].measures.push(measure);
    }
  }

  // TODO chord diagrams

  return score;
}

function readNote(cursor: BufferCursor): Note {
  const [
    hasFingering,
    _isAccentuated,
    _hasNoteType,
    hasNoteDynamic,
    hasNoteEffects,
    _isGhostNote,
    _isDottedNote,
    hasDuration,
  ] = bits(cursor.nextNumber(NumberType.Uint8));

  /* const variant = */ cursor.nextNumber(NumberType.Uint8);

  // if (hasNoteType) {
  //   /* const type = */ cursor.nextNumber(NumberType.Uint16);
  // }

  let duration = 0;
  if (hasDuration) {
    const durationType = cursor.nextNumber(NumberType.Int8);
    // -2 = whole note, -1 = half note, ...
    duration = 1 << (4 - Math.max(4, durationType)); // TODO understand the max duration
    /* const tuplet = */ cursor.nextNumber(NumberType.Uint8);
  }

  if (hasNoteDynamic) {
    /* const dynamic = */ cursor.nextNumber(NumberType.Uint8);
  }

  const fret = cursor.nextNumber(NumberType.Uint8);

  if (hasFingering) {
    /* const leftHandFingering = */ cursor.nextNumber(NumberType.Uint8);
    /* const rightHandFingering = */ cursor.nextNumber(NumberType.Uint8);
  }

  if (hasNoteEffects) {
    const [_blank1, _blank2, _blank3, hasGraceNote, _letRing, _hasSlide_v3, _isHammerOnPullOff, hasBend] = bits(
      cursor.nextNumber(NumberType.Uint8)
    );

    const [
      _blank2_1,
      _leftHandVibrato,
      hasTrill,
      hasHarmonics,
      hasSlide,
      hasTremoloPicking,
      _palmMute,
      _staccato,
    ] = bits(cursor.nextNumber(NumberType.Uint8));

    if (hasBend) {
      /* const bend = */ readBend(cursor);
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
      /* const slideStyle = */ cursor.nextNumber(NumberType.Uint8);
    }

    if (hasHarmonics) {
      /* const harmonicStyle = */ cursor.nextNumber(NumberType.Uint8);
    }

    if (hasTrill) {
      /* const fret = */ cursor.nextNumber(NumberType.Uint8);
      /* const period = */ cursor.nextNumber(NumberType.Uint8);
    }
  }

  return {
    duration,
    placement: {
      fret,
      string: 0,
    },
  };
}

function readChordDiagram(cursor: BufferCursor) {
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
  /* const baseFret = */ cursor.nextNumber(NumberType.Uint32);

  /* const fret1 = */ cursor.nextNumber(NumberType.Uint32);
  /* const fret2 = */ cursor.nextNumber(NumberType.Uint32);
  /* const fret3 = */ cursor.nextNumber(NumberType.Uint32);
  /* const fret4 = */ cursor.nextNumber(NumberType.Uint32);
  /* const fret5 = */ cursor.nextNumber(NumberType.Uint32);
  /* const fret6 = */ cursor.nextNumber(NumberType.Uint32);
  /* const fret7 = */ cursor.nextNumber(NumberType.Uint32);

  /* const numBarres = */ cursor.nextNumber(NumberType.Uint8);

  /* const barreFret1 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreFret2 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreFret3 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreFret4 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreFret5 = */ cursor.nextNumber(NumberType.Uint8);

  /* const barreStart1 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreStart2 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreStart3 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreStart4 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreStart5 = */ cursor.nextNumber(NumberType.Uint8);

  /* const barreEnd1 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreEnd2 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreEnd3 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreEnd4 = */ cursor.nextNumber(NumberType.Uint8);
  /* const barreEnd5 = */ cursor.nextNumber(NumberType.Uint8);

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
  let numLines = cursor.nextNumber(NumberType.Uint32);
  while (numLines > 0) {
    /* const line = */ cursor.nextLengthPrefixedString(NumberType.Uint32);
    numLines -= 1;
  }
}

function readLyrics(cursor: BufferCursor) {
  /* const track = */ cursor.nextNumber(NumberType.Uint32);
  for (let i = 0; i < 5; ++i) {
    /* const startFromBar = */ cursor.nextNumber(NumberType.Uint32);
    /* const line = */ cursor.nextLengthPrefixedString(NumberType.Uint32);
  }
}

function readMidiChannels(cursor: BufferCursor) {
  for (let port = 1; port <= 4; ++port) {
    for (let channel = 1; channel <= 16; ++channel) {
      /* const instrument = */ cursor.nextNumber(NumberType.Uint32);
      /* const volume = */ cursor.nextNumber(NumberType.Uint8);
      /* const balance = */ cursor.nextNumber(NumberType.Uint8);
      /* const chorus = */ cursor.nextNumber(NumberType.Uint8);
      /* const reverb = */ cursor.nextNumber(NumberType.Uint8);
      /* const phaser = */ cursor.nextNumber(NumberType.Uint8);
      /* const tremolo = */ cursor.nextNumber(NumberType.Uint8);
      /* const blank1 = */ cursor.nextNumber(NumberType.Uint8);
      /* const blank2 = */ cursor.nextNumber(NumberType.Uint8);
    }
  }
}

function readBend(cursor: BufferCursor) {
  /* const type = */ cursor.nextNumber(NumberType.Uint8);
  /* const amplitude = */ cursor.nextNumber(NumberType.Uint32);
  const numPoints = cursor.nextNumber(NumberType.Uint32);
  for (let point = 0; point < numPoints; ++point) {
    /* const absoluteTimePosition = */ cursor.nextNumber(NumberType.Uint32);
    /* const verticalPosition = */ cursor.nextNumber(NumberType.Uint32);
    /* const vibrato = */ cursor.nextNumber(NumberType.Uint8);
  }
}

function readInfoString(cursor: BufferCursor): string {
  const length = cursor.nextNumber(NumberType.Uint32) - 1;
  cursor.skip();
  return cursor.nextString(length);
}
