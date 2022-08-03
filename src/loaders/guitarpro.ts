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
  StrokeDirection,
  TapStyle,
  TimeSignature,
} from "../notation";
import { NoteValue, NoteValueName } from "../notation/note_value";
import { Loader } from "./Loader";
import { BufferCursor, NumberType } from "./util/BufferCursor";

// TODO different versions

const debug = process.env.NODE_ENV == "development";

const VERSION_REGEX = /FICHIER GUITAR PRO v(?<major>\d{1}).(?<minor>\d{2})/;

enum Version {
  v4,
}

// Implemented with help from http://dguitar.sourceforge.net/GP4format.html (some adjustments, it's not totally correct)

export default function loader(source: ArrayBuffer): Loader {
  return new GuitarProLoader(source);
}

class GuitarProLoader {
  private cursor: BufferCursor;

  constructor(source: ArrayBuffer) {
    this.cursor = new BufferCursor(source);
  }

  load(): Score {
    this.cursor.reset();

    //------------------------------------------------------------------------------------------------
    // Song attributes
    //------------------------------------------------------------------------------------------------

    /* const version = */ this.readVersion();

    debug && console.debug("tab info");
    const tabInformation = {
      title: this.readInfoString(),
      subtitle: this.readInfoString(),
      artist: this.readInfoString(),
      album: this.readInfoString(),
      composer: this.readInfoString(),
      copyright: this.readInfoString(),
      transcriber: this.readInfoString(),
      instructions: this.readInfoString(),
    };
    debug && console.debug({ tabInformation });

    debug && console.debug("comments");
    const comments = this.readComments();
    debug && console.debug({ comments });

    /* const tripletFeel = */ this.cursor.nextNumber(NumberType.Uint8);

    debug && console.debug("lyrics");
    this.readLyrics();

    const tempo = this.cursor.nextNumber(NumberType.Uint32);
    /* const key = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const octave = */ this.cursor.nextNumber(NumberType.Uint32);

    debug && console.debug("midi channels");
    const midiPorts = this.readMidiChannels();

    const numMeasures = this.cursor.nextNumber(NumberType.Uint32);
    const numTracks = this.cursor.nextNumber(NumberType.Uint32);

    const score: Score = {
      parts: [],
      comments,
      ...tabInformation,
    };

    //------------------------------------------------------------------------------------------------
    // Measure props
    //------------------------------------------------------------------------------------------------

    let currentTimeSignature = new TimeSignature(new NoteValue(NoteValueName.Whole), 4);

    const measureData = range(numMeasures).map((index) => {
      debug && console.debug({ measureDataIndex: index });

      const [
        _doubleBar,
        hasKeySignature,
        hasMarker,
        hasAlternateEnding,
        endOfRepeat,
        _startOfRepeat,
        hasTimeSignatureDenominator,
        hasTimeSignatureNumerator,
      ] = bits(this.cursor.nextNumber(NumberType.Uint8));

      let numerator, denominator;
      if (hasTimeSignatureNumerator) {
        numerator = this.cursor.nextNumber(NumberType.Uint8);
      }

      if (hasTimeSignatureDenominator) {
        denominator = this.cursor.nextNumber(NumberType.Uint8);
      }

      if (numerator || denominator) {
        currentTimeSignature = new TimeSignature(
          denominator ? NoteValue.fromNumber(denominator) : currentTimeSignature.value,
          numerator ?? currentTimeSignature.count
        );
      }

      if (endOfRepeat) {
        /* const numRepeats = */ this.cursor.nextNumber(NumberType.Uint8);
      }

      if (hasAlternateEnding) {
        /* const alternateEnding = */ this.cursor.nextNumber(NumberType.Uint8);
      }

      let marker;
      if (hasMarker) {
        const name = this.cursor.nextLengthPrefixedString(NumberType.Uint32);
        const color = this.readColor();
        marker = {
          text: name,
          color,
        };
      }

      if (hasKeySignature) {
        /* const alterations = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const minor = */ this.cursor.nextNumber(NumberType.Uint8);
      }

      return {
        marker,
        timeSignature: {
          value: currentTimeSignature,
          changed: !!(numerator || denominator),
        },
      };
    });

    //------------------------------------------------------------------------------------------------
    // Track props
    //------------------------------------------------------------------------------------------------

    const trackData = range(numTracks).map((index) => {
      debug && console.debug({ trackDataIndex: index });

      const [_blank1, _blank2, _blank3, _blank4, _blank5, _banjoTrack, _twelveStringTrack, _drumsTrack] = bits(
        this.cursor.nextNumber(NumberType.Uint8)
      );

      const name = this.cursor.nextLengthPrefixedString(NumberType.Uint8);
      this.cursor.skip(40 - name.length);

      const numStrings = this.cursor.nextNumber(NumberType.Uint32);
      const stringTuning = range(7)
        .map(() => {
          const value = this.cursor.nextNumber(NumberType.Uint32);
          return Pitch.fromMidi(value);
        })
        .slice(0, numStrings);

      const midiPort = this.cursor.nextNumber(NumberType.Uint32);
      const midiChannel = this.cursor.nextNumber(NumberType.Uint32);
      /* const midiChannelEffects = */ this.cursor.nextNumber(NumberType.Uint32);
      /* const numberOfFrets = */ this.cursor.nextNumber(NumberType.Uint32);
      /* const capoFret = */ this.cursor.nextNumber(NumberType.Uint32);
      /* const color = */ this.cursor.nextNumber(NumberType.Uint32);

      const midiData = midiPorts[midiPort - 1][midiChannel - 1];
      score.parts.push({
        name,
        lineCount: numStrings,
        measures: [],
        instrument: {
          type: midiChannel == 10 ? "percussion" : "regular",
          midiPreset: midiData.instrument ?? 24,
          volume: midiData.volume,
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

    let currentMeasureTempo = tempo;

    for (let measureIndex = 0; measureIndex < numMeasures; ++measureIndex) {
      let tempoChanged = true;

      for (let trackIndex = 0; trackIndex < numTracks; ++trackIndex) {
        debug && console.debug({ trackIndex, measureIndex });

        const measure: Measure = {
          chords: [],
          number: measureIndex + 1,
          marker: measureData[measureIndex].marker,
          staffDetails: {
            time: measureData[measureIndex].timeSignature,
          },
        };

        const numBeats = this.cursor.nextNumber(NumberType.Uint32);
        for (let beat = 0; beat < numBeats; ++beat) {
          const [_blank1, hasStatus, hasTuplet, hasMixTableChangeEvent, hasEffects, hasText, hasChordDiagram, dotted] =
            bits(this.cursor.nextNumber(NumberType.Uint8));

          let rest = false;
          if (hasStatus) {
            const status = this.cursor.nextNumber(NumberType.Uint8);
            rest = status == 0x02;
          }

          let duration = NoteValue.fromNumber(1 << (this.cursor.nextNumber(NumberType.Int8) + 2));
          if (dotted) {
            duration = duration.dot();
          }

          if (hasTuplet) {
            const n = this.cursor.nextNumber(NumberType.Uint32);

            // TODO actual is derived for simple metre here, but will need to eventual deal with compound
            let actual = 1;
            while (2 * actual < n) {
              actual <<= 1;
            }
            duration = duration.withTuplet({ n, actual });
          }

          let chordDiagram;
          if (hasChordDiagram) {
            chordDiagram = this.readChordDiagram();
          }

          let text;
          if (hasText) {
            text = this.cursor.nextLengthPrefixedString(NumberType.Uint32);
          }

          let tapStyle: TapStyle | undefined;
          let strokeDirection: StrokeDirection | undefined;
          let strokeDuration: NoteValue | undefined;
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
            ] = bits(this.cursor.nextNumber(NumberType.Uint8));

            const [_blank2_1, _blank2_2, _blank2_3, _blank2_4, _blank2_5, hasTremolo, hasPickstroke, _hasRasguedo] =
              bits(this.cursor.nextNumber(NumberType.Uint8));

            if (hasTapping) {
              const style = this.cursor.nextNumber(NumberType.Uint8);
              switch (style) {
                case 0:
                  // none, ignore;
                  break;
                case 1:
                  tapStyle = TapStyle.Tap;
                  break;
                case 2:
                  tapStyle = TapStyle.Slap;
                  break;
                case 3:
                  tapStyle = TapStyle.Pop;
                  break;
                default:
                  throw new Error(`unknown tap style value: ${style}`);
              }
            }

            if (hasTremolo) {
              /* const effect = */ this.readBend();
            }

            let downstrokeDuration: number | undefined;
            let upstrokeDuration: number | undefined;
            if (hasStroke) {
              downstrokeDuration = this.cursor.nextNumber(NumberType.Uint8);
              upstrokeDuration = this.cursor.nextNumber(NumberType.Uint8);
            }

            if (hasPickstroke) {
              const direction = this.cursor.nextNumber(NumberType.Uint8);
              switch (direction) {
                case 0:
                  // none, ignore
                  break;
                case 1:
                  strokeDirection = StrokeDirection.Up;
                  break;
                case 2:
                  strokeDirection = StrokeDirection.Down;
                  break;
              }
            }

            if (downstrokeDuration && downstrokeDuration !== 0) {
              strokeDirection ??= StrokeDirection.Down;
              strokeDuration = NoteValue.fromNumber(Math.pow(2, 8 - downstrokeDuration));
            } else if (upstrokeDuration && upstrokeDuration !== 0) {
              strokeDirection ??= StrokeDirection.Up;
              strokeDuration = NoteValue.fromNumber(Math.pow(2, 8 - upstrokeDuration));
            }
          }

          if (hasMixTableChangeEvent) {
            /* const instrument = */ this.cursor.nextNumber(NumberType.Int8);
            const volume = this.cursor.nextNumber(NumberType.Int8);
            const pan = this.cursor.nextNumber(NumberType.Int8);
            const chorus = this.cursor.nextNumber(NumberType.Int8);
            const reverb = this.cursor.nextNumber(NumberType.Int8);
            const phaser = this.cursor.nextNumber(NumberType.Int8);
            const tremolo = this.cursor.nextNumber(NumberType.Int8);
            const tempo = this.cursor.nextNumber(NumberType.Int32);
            if (volume !== -1) {
              /* const volumeChangeDuration = */ this.cursor.nextNumber(NumberType.Uint8);
            }
            if (pan !== -1) {
              /* const panChangeDuration = */ this.cursor.nextNumber(NumberType.Uint8);
            }
            if (chorus !== -1) {
              /* const chorusChangeDuration = */ this.cursor.nextNumber(NumberType.Uint8);
            }
            if (reverb !== -1) {
              /* const reverbChangeDuration = */ this.cursor.nextNumber(NumberType.Uint8);
            }
            if (phaser !== -1) {
              /* const phaserChangeDuration = */ this.cursor.nextNumber(NumberType.Uint8);
            }
            if (tremolo !== -1) {
              /* const tremoloChangeDuration = */ this.cursor.nextNumber(NumberType.Uint8);
            }
            if (tempo !== -1) {
              /* const tempoChangeDuration = */ this.cursor.nextNumber(NumberType.Uint8);
              if (tempo !== currentMeasureTempo) {
                currentMeasureTempo = tempo;
                tempoChanged = true;
              }

              // TODO need to track the beats, if the value isn't 0
            }

            const [_blank1, _blank2, _tremoloAll, _phaserAll, _reverbAll, _chorusAll, _panAll, _volumeAll] = bits(
              this.cursor.nextNumber(NumberType.Uint8)
            );
          }

          // Max 7 strings, so git rid of the unused, most-significant bit
          const strings = bits(this.cursor.nextNumber(NumberType.Uint8)).slice(1);
          const notes = [];
          for (let string = 0; string < trackData[trackIndex].numStrings; ++string) {
            if (strings[string]) {
              const noteOptions = this.readNote(trackData[trackIndex].stringTuning[string], duration);
              noteOptions.placement ??= { fret: 0, string };
              noteOptions.placement.string = string + 1;
              notes.push(new Note(noteOptions));
            }
          }

          measure.staffDetails.tempo = {
            value: currentMeasureTempo,
            changed: tempoChanged,
          };

          measure.chords.push({
            notes,
            chordDiagram,
            text,
            value: duration,
            stroke: strokeDirection ? { direction: strokeDirection, duration: strokeDuration } : undefined,
            tapped: tapStyle,
            rest: rest || notes.length == 0,
          });
        }

        tempoChanged = false;
        score.parts[trackIndex].measures.push(measure);
      }
    }

    return score;
  }

  readNote(stringTuning: Pitch, defaultNoteValue: NoteValue) {
    const [
      hasFingering,
      isAccentuated,
      hasNoteType,
      hasNoteDynamic,
      hasNoteEffects,
      isGhostNote,
      _isDottedNote,
      hasDuration,
    ] = bits(this.cursor.nextNumber(NumberType.Uint8));

    // 1 = normal note
    // 2 = tie (link with previous)
    // 3 = dead note
    let noteType = 0;
    if (hasNoteType) {
      noteType = this.cursor.nextNumber(NumberType.Uint8);
    }

    // TODO currently ignore this duration. Good or bad?
    const duration = 0;
    if (hasDuration) {
      // -2 = whole note, -1 = half note, ...
      /* const durationType = */ this.cursor.nextNumber(NumberType.Int8);

      // duration = 1 << (4 - Math.max(4, durationType)); // TODO understand the max duration
      /* const tuplet = */ this.cursor.nextNumber(NumberType.Uint8);
    }

    let dynamic;
    if (hasNoteDynamic) {
      const dynamicValue = this.cursor.nextNumber(NumberType.Uint8);
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

    let fret = 0;
    if (hasNoteType) {
      fret = this.cursor.nextNumber(NumberType.Uint8);
    }

    if (hasFingering) {
      /* const leftHandFingering = */ this.cursor.nextNumber(NumberType.Uint8);
      /* const rightHandFingering = */ this.cursor.nextNumber(NumberType.Uint8);
    }

    // options initialized here because pitch/value have to be defined
    const options: NoteOptions = {
      pitch: stringTuning.adjust(fret),
      value: duration == 0 ? defaultNoteValue : NoteValue.fromNumber(duration),
      dead: noteType === 3,
      tie: noteType === 2 ? { type: "stop" } : undefined,
      ghost: isGhostNote,
      accent: isAccentuated ? AccentStyle.Accentuated : undefined,
      dynamic,
      placement: {
        fret,
        string: 0,
      },
    };

    if (hasNoteEffects) {
      const [_blank1, _blank2, _blank3, hasGraceNote, letRing, _hasSlide_v3, _isHammerOnPullOff, hasBend] = bits(
        this.cursor.nextNumber(NumberType.Uint8)
      );

      const [_blank2_1, leftHandVibrato, hasTrill, hasHarmonics, hasSlide, hasTremoloPicking, isPalmMute, isStaccato] =
        bits(this.cursor.nextNumber(NumberType.Uint8));

      options.letRing = letRing;
      options.palmMute = isPalmMute;
      options.staccato = isStaccato;
      options.vibrato = leftHandVibrato;

      if (hasBend) {
        options.bend = this.readBend();
      }

      if (hasGraceNote) {
        /* const fret = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const dynamic = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const transition = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const duration = */ this.cursor.nextNumber(NumberType.Uint8);
      }

      if (hasTremoloPicking) {
        /* const tremoloDuration = */ this.cursor.nextNumber(NumberType.Uint8);
      }

      if (hasSlide) {
        const slideStyle = this.cursor.nextNumber(NumberType.Int8);

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
        const harmonicStyle = this.cursor.nextNumber(NumberType.Uint8);
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
        /* const fret = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const period = */ this.cursor.nextNumber(NumberType.Uint8);
      }
    }

    return options;
  }

  readChordDiagram(): ChordDiagram {
    /* const version */ this.cursor.nextNumber(NumberType.Uint8);
    /* const sharp = */ this.cursor.nextNumber(NumberType.Uint8);

    /* const blank1 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const blank2 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const blank3 = */ this.cursor.nextNumber(NumberType.Uint8);

    /* const root = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const majorMinor = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const nineElevenThirteen = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const bass = */ this.cursor.nextNumber(NumberType.Uint32);
    /* const diminishedAugmented = */ this.cursor.nextNumber(NumberType.Uint32);
    /* const add = */ this.cursor.nextNumber(NumberType.Uint8);

    const name = this.cursor.nextLengthPrefixedString();
    this.cursor.skip(20 - name.length);

    /* const blank4 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const blank5 = */ this.cursor.nextNumber(NumberType.Uint8);

    /* const fifth = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const ninth = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const eleventh = */ this.cursor.nextNumber(NumberType.Uint8);

    const baseFret = this.cursor.nextNumber(NumberType.Uint32);

    const frets = [
      this.cursor.nextNumber(NumberType.Int32),
      this.cursor.nextNumber(NumberType.Int32),
      this.cursor.nextNumber(NumberType.Int32),
      this.cursor.nextNumber(NumberType.Int32),
      this.cursor.nextNumber(NumberType.Int32),
      this.cursor.nextNumber(NumberType.Int32),
      this.cursor.nextNumber(NumberType.Int32),
    ];

    const numBarres = this.cursor.nextNumber(NumberType.Uint8);

    const barreFrets = [
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
    ];

    const barreStarts = [
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
    ];

    const barreEnds = [
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
      this.cursor.nextNumber(NumberType.Uint8),
    ];

    /* const omission1 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const omission3 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const omission5 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const omission7 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const omission9 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const omission11 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const omission13 = */ this.cursor.nextNumber(NumberType.Uint8);

    /* const blank6 = */ this.cursor.nextNumber(NumberType.Uint8);

    /* const fingering1 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const fingering2 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const fingering3 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const fingering4 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const fingering5 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const fingering6 = */ this.cursor.nextNumber(NumberType.Uint8);
    /* const fingering7 = */ this.cursor.nextNumber(NumberType.Uint8);

    /* const showDiagonalFingering = */ this.cursor.nextNumber(NumberType.Uint8);

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

  readComments() {
    const numCommentLines = this.cursor.nextNumber(NumberType.Uint32);
    debug && console.debug({ numCommentLines });
    return range(numCommentLines).map(() => {
      return this.cursor.nextLengthPrefixedString(NumberType.Uint32);
    });
  }

  readLyrics() {
    /* const track = */ this.cursor.nextNumber(NumberType.Uint32);
    for (let i = 0; i < 5; ++i) {
      /* const startFromBar = */ this.cursor.nextNumber(NumberType.Uint32);
      /* const line = */ this.cursor.nextLengthPrefixedString(NumberType.Uint32);
    }
  }

  readMidiChannels() {
    const ports = [];

    for (let port = 1; port <= 4; ++port) {
      const channels = [];
      for (let channel = 1; channel <= 16; ++channel) {
        const instrument = this.cursor.nextNumber(NumberType.Uint32);
        const volume = this.cursor.nextNumber(NumberType.Uint8);
        /* const balance = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const chorus = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const reverb = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const phaser = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const tremolo = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const blank1 = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const blank2 = */ this.cursor.nextNumber(NumberType.Uint8);

        channels.push({
          instrument,
          volume: volume / 255.0,
        });
      }

      ports.push(channels);
    }

    return ports;
  }

  readBend(): Bend | undefined {
    let type: BendType;
    const bendTypeValue = this.cursor.nextNumber(NumberType.Uint8);
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

    const amplitude = this.cursor.nextNumber(NumberType.Uint32) / 100.0;
    const numPoints = this.cursor.nextNumber(NumberType.Uint32);
    const points = range(numPoints).map((_) => {
      const time = this.cursor.nextNumber(NumberType.Uint32) / 60.0;
      const amplitude = this.cursor.nextNumber(NumberType.Uint32) / 100.0;

      // 0 = none, 1 = fast, 2 = average, 3 = slow
      const vibrato = this.cursor.nextNumber(NumberType.Uint8);

      return { time, amplitude, vibrato };
    });

    return {
      type,
      amplitude,
      points,
    };
  }

  readColor(): string {
    const _ = this.cursor.nextNumber(NumberType.Uint8);
    const b = this.cursor.nextNumber(NumberType.Uint8);
    const g = this.cursor.nextNumber(NumberType.Uint8);
    const r = this.cursor.nextNumber(NumberType.Uint8);
    const c = padStart(((r << 16) | (g << 8) | b).toString(16), 6, "0");
    return `#${c}`;
  }

  readInfoString(): string {
    const length = this.cursor.nextNumber(NumberType.Uint32) - 1;
    this.cursor.skip(); // some extra byte that appears to be the length of the string???
    if (length <= 0) {
      return "";
    } else {
      return this.cursor.nextString(length);
    }
  }

  readVersion() {
    const version = this.cursor.nextLengthPrefixedString();

    const execResult = VERSION_REGEX.exec(version);
    let major: string | undefined;
    let minor: string | undefined;
    if (execResult) {
      major = execResult[1];
      minor = execResult[2];
    }

    try {
      switch (major) {
        case "4":
          return Version.v4;
        default:
          throw new Error(`Unsupported Guitar Pro version: ${major} (minor version: ${minor})`);
      }
    } finally {
      this.cursor.skip(30 - version.length);
      debug && console.debug({ version });
    }
  }
}

const bits = (byte: number): boolean[] => {
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
};
