import { omit, padStart, range, zip } from "lodash";
import {
  AccentStyle,
  Bend,
  BendType,
  Chord,
  ChordDiagram,
  HarmonicStyle,
  Marker,
  Measure,
  Note,
  NoteDynamic,
  NoteOptions,
  Part,
  Pitch,
  Score,
  Slide,
  SlideType,
  StrokeDirection,
  TapStyle,
  TimeSignature,
} from "../notation";
import { NoteValue, NoteValueName } from "../notation/NoteValue";
import { Loader } from "./Loader";
import { BufferCursor, NumberType } from "./util/BufferCursor";

const debug = !!import.meta.env?.VITE_DEBUG_APP;

const VERSION_REGEX = /FICHIER GUITAR PRO v(?<version>\d{1}\.\d{1,2})/;

// Implemented with help from http://dguitar.sourceforge.net/GP4format.html (some adjustments, it's not totally correct)

const loader = (source: ArrayBuffer): Loader => new GuitarProLoader(source);

export default loader;

interface TrackData {
  name: string;
  strings: Pitch[];
  midiPort: number;
  midiChannel: number;
  color?: string;
}

interface MeasureData {
  marker?: Marker;
  timeSignature: {
    value: TimeSignature;
    changed: boolean;
  };
}

interface GraceNote {
  fret: number;
  value: NoteValue;
  dynamic?: NoteDynamic;
  transition?: number;
}

type NoteEffects = Partial<Omit<NoteOptions, "graceNote">> & { graceNote?: GraceNote };

class GuitarProLoader {
  private cursor: BufferCursor;
  private version: number;
  private currentMeasureTempo = 0;
  private trackData: TrackData[] = [];
  private measureData: MeasureData[] = [];

  constructor(source: ArrayBuffer) {
    this.cursor = new BufferCursor(source);
    this.version = this.readVersion();
  }

  load(): Score {
    //------------------------------------------------------------------------------------------------
    // Song attributes
    //------------------------------------------------------------------------------------------------

    this.debug("tab info");
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
    this.debug({ tabInformation });

    this.debug("comments");
    const comments = this.readComments();
    this.debug({ comments });

    /* const tripletFeel = */ this.cursor.nextNumber(NumberType.Uint8);

    this.readLyrics();

    this.debug("tempo/key/octave");
    this.currentMeasureTempo = this.cursor.nextNumber(NumberType.Uint32);
    /* const key = */ this.cursor.nextNumber(NumberType.Uint8);
    if (this.version < 4) {
      // TODO what are these? Is the key + octave packed into 4 bytes?
      this.cursor.skip(3);
    } else {
      /* const octave = */ this.cursor.nextNumber(NumberType.Uint32);
    }

    this.debug("midi channels");
    const midiPorts = this.readMidiChannels();

    this.debug("track/measure count");
    const numMeasures = this.cursor.nextNumber(NumberType.Uint32);
    const numTracks = this.cursor.nextNumber(NumberType.Uint32);
    this.debug({ numTracks, numMeasures });

    //------------------------------------------------------------------------------------------------
    // Measure props
    //------------------------------------------------------------------------------------------------

    this.debug("measure data");
    let currentTimeSignature = new TimeSignature(new NoteValue(NoteValueName.Whole), 4);
    this.measureData = range(numMeasures).map((_index) => {
      const measureData = this.readMeasureData(currentTimeSignature);
      currentTimeSignature = measureData.timeSignature.value;
      return measureData;
    });

    //------------------------------------------------------------------------------------------------
    // Track props
    //------------------------------------------------------------------------------------------------

    const parts: Part[] = [];

    this.debug("track data");
    for (let trackIndex = 0; trackIndex < numTracks; ++trackIndex) {
      const trackData = this.readTrackData();
      this.trackData.push(trackData);
      const midiData = midiPorts[trackData.midiPort - 1][trackData.midiChannel - 1];
      parts.push(
        new Part({
          name: trackData.name,
          color: trackData.color,
          lineCount: trackData.strings.length,
          measures: [],
          instrument: {
            type: trackData.midiChannel == 10 ? "percussion" : "regular",
            midiPreset: midiData.instrument ?? 24,
            volume: midiData.volume,
            tuning: trackData.strings,
          },
        }),
      );
    }

    //------------------------------------------------------------------------------------------------
    // Track/measure beats
    //------------------------------------------------------------------------------------------------

    for (let measureIndex = 0; measureIndex < numMeasures; ++measureIndex) {
      for (let trackIndex = 0; trackIndex < numTracks; ++trackIndex) {
        this.debug({ trackIndex, measureIndex });

        const tempoBefore = this.currentMeasureTempo;
        const numBeats = this.cursor.nextNumber(NumberType.Uint32);
        const chords = range(numBeats).map(() => this.readBeat(this.trackData[trackIndex]));

        parts[trackIndex].measures.push(
          new Measure({
            chords,
            number: measureIndex + 1,
            marker: this.measureData[measureIndex].marker,
            staffDetails: {
              time: this.measureData[measureIndex].timeSignature,
              tempo: {
                value: this.currentMeasureTempo,
                changed: measureIndex == 0 || tempoBefore != this.currentMeasureTempo,
              },
            },
          }),
        );
      }
    }

    return new Score({
      parts,
      comments,
      ...tabInformation,
    });
  }

  readMeasureData(defaultTimeSignature: TimeSignature): MeasureData {
    // TODO show repeats

    const bits1 = bits(this.cursor.nextNumber(NumberType.Uint8));
    const [
      _doubleBar,
      hasKeySignature,
      hasMarker,
      hasAlternateEnding,
      endOfRepeat,
      _startOfRepeat,
      hasTimeSignatureDenominator,
      hasTimeSignatureNumerator,
    ] = bits1;

    let numerator, denominator;
    if (hasTimeSignatureNumerator) {
      numerator = this.cursor.nextNumber(NumberType.Uint8);
    }

    if (hasTimeSignatureDenominator) {
      denominator = this.cursor.nextNumber(NumberType.Uint8);
    }

    let timeSignature: TimeSignature = defaultTimeSignature;
    if (numerator || denominator) {
      // TODO could these be set but not changing?
      timeSignature = new TimeSignature(
        denominator ? NoteValue.fromNumber(denominator) : defaultTimeSignature.value,
        numerator ?? defaultTimeSignature.count,
      );
    }

    if (endOfRepeat) {
      /* const numRepeats = */ this.cursor.nextNumber(NumberType.Uint8);
    }

    if (hasAlternateEnding) {
      /* const alternateEnding = */ this.cursor.nextNumber(NumberType.Uint8);
    }

    let marker: Marker | undefined;
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
        value: timeSignature,
        changed: !!(numerator || denominator),
      },
    };
  }

  readTrackData(): TrackData {
    const bits1 = bits(this.cursor.nextNumber(NumberType.Uint8));
    const [_blank1, _blank2, _blank3, _blank4, _blank5, _banjoTrack, _twelveStringTrack, _drumsTrack] = bits1;

    const name = this.cursor.nextLengthPrefixedString(NumberType.Uint8);
    this.cursor.skip(40 - name.length);

    const numStrings = this.cursor.nextNumber(NumberType.Uint32);
    const strings = range(7)
      .map(() => {
        const value = this.cursor.nextNumber(NumberType.Uint32);
        return Pitch.fromMidi(value);
      })
      .slice(0, numStrings);

    // TODO show capo fret

    const midiPort = this.cursor.nextNumber(NumberType.Uint32);
    const midiChannel = this.cursor.nextNumber(NumberType.Uint32);
    /* const midiChannelEffects = */ this.cursor.nextNumber(NumberType.Uint32);
    /* const numberOfFrets = */ this.cursor.nextNumber(NumberType.Uint32);
    /* const capoFret = */ this.cursor.nextNumber(NumberType.Uint32);

    const colorNumber = this.cursor.nextNumber(NumberType.Uint32);
    let color: string | undefined;
    if (colorNumber != 0) {
      const r = (colorNumber & 0x0000ff) >> 0;
      const g = (colorNumber & 0x00ff00) >> 8;
      const b = (colorNumber & 0xff0000) >> 16;
      color = `rgb(${r}, ${g}, ${b})`;
    }

    return {
      name,
      color,
      midiPort,
      midiChannel,
      strings,
    };
  }

  readBeat(trackData: TrackData): Chord {
    const bits1 = bits(this.cursor.nextNumber(NumberType.Uint8));
    const [_blank1, hasStatus, hasTuplet, hasMixTableChangeEvent, hasEffects, hasText, hasChordDiagram, dotted] = bits1;

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

    let effects: ReturnType<typeof this.readBeatEffects> | undefined;
    if (hasEffects) {
      effects = this.readBeatEffects();
    }

    if (hasMixTableChangeEvent) {
      this.readMixTableChangeEvent();
    }

    // Max 7 strings, so git rid of the unused, most-significant bit
    const strings = bits(this.cursor.nextNumber(NumberType.Uint8)).slice(1);
    const notes = [];
    for (let string = 0; string < trackData.strings.length; ++string) {
      if (!strings[string]) {
        continue;
      }

      const noteOptions = this.readNote(trackData.strings[string], duration);
      noteOptions.placement ??= { fret: 0, string };
      noteOptions.placement.string = string + 1;
      if (!rest) {
        notes.push(new Note(noteOptions));
      }
    }

    return new Chord({
      notes,
      chordDiagram,
      text,
      value: duration,
      ...effects,
    });
  }

  readBeatEffects(): Pick<Chord, "tapped" | "stroke"> {
    let tapStyle: TapStyle | undefined;
    let strokeDirection: StrokeDirection | undefined;
    let strokeDuration: NoteValue | undefined;
    let downstrokeDuration: number | undefined;
    let upstrokeDuration: number | undefined;

    if (this.version < 4) {
      const bits1 = bits(this.cursor.nextNumber(NumberType.Uint8));
      const [_b1, hasStroke, hasTapping, _fadeIn, _artificialH, _naturalH, _vibrato, _wideVibrato] = bits1;

      if (hasTapping) {
        const style = this.readTapping();
        if (style) {
          tapStyle = style;
        }
      }

      if (hasStroke) {
        downstrokeDuration = this.cursor.nextNumber(NumberType.Uint8);
        upstrokeDuration = this.cursor.nextNumber(NumberType.Uint8);
      }
    } else {
      const bits1 = bits(this.cursor.nextNumber(NumberType.Uint8));
      const bits2 = bits(this.cursor.nextNumber(NumberType.Uint8));

      const [_b1, hasStroke, hasTapping, _fadeIn_v3, _artificialH_v3, _naturalH_v3, _vibrato_v3, _wideV_v3] = bits1;
      const [_b2, _b3, _b4, _b5, _b6, hasTremolo, hasPickstroke, _hasRasguedo] = bits2;

      if (hasTapping) {
        const style = this.readTapping();
        if (style) {
          tapStyle = style;
        }
      }

      if (hasTremolo) {
        /* const effect = */ this.readBend();
      }

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
    }

    if (downstrokeDuration && downstrokeDuration !== 0) {
      strokeDirection ??= StrokeDirection.Down;
      strokeDuration = NoteValue.fromNumber(Math.pow(2, 8 - downstrokeDuration));
    } else if (upstrokeDuration && upstrokeDuration !== 0) {
      strokeDirection ??= StrokeDirection.Up;
      strokeDuration = NoteValue.fromNumber(Math.pow(2, 8 - upstrokeDuration));
    }

    return {
      stroke: strokeDirection ? { direction: strokeDirection, duration: strokeDuration } : undefined,
      tapped: tapStyle,
    };
  }

  readTapping(): TapStyle | undefined {
    const style = this.cursor.nextNumber(NumberType.Uint8);
    switch (style) {
      case 0:
        if (this.version < 4) {
          // TODO read tremolo
        }
        return undefined;
      case 1:
        return TapStyle.Tap;
      case 2:
        return TapStyle.Slap;
      case 3:
        return TapStyle.Pop;
      default:
        throw new Error(`unknown tap style value: ${style}`);
    }
  }

  readMixTableChangeEvent() {
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
    }

    const [_blank1, _blank2, _tremoloAll, _phaserAll, _reverbAll, _chorusAll, _panAll, _volumeAll] = bits(
      this.cursor.nextNumber(NumberType.Uint8),
    );

    if (tempo !== -1 && tempo !== this.currentMeasureTempo) {
      this.currentMeasureTempo = tempo;
      return true;
    }

    return false;
  }

  readNote(stringTuning: Pitch, defaultNoteValue: NoteValue): NoteOptions {
    const bits1 = bits(this.cursor.nextNumber(NumberType.Uint8));
    const [
      hasFingering,
      isAccentuated,
      hasNoteType,
      hasNoteDynamic,
      hasNoteEffects,
      isGhostNote,
      _isDottedNote,
      hasDuration,
    ] = bits1;

    // 1 = normal note
    // 2 = tie (link with previous)
    // 3 = dead note
    let noteType = 0;
    if (hasNoteType) {
      noteType = this.cursor.nextNumber(NumberType.Uint8);
    }

    // TODO currently ignore this duration. Fine for tabs, okay for scores?
    const duration = 0;
    if (hasDuration) {
      // -2 = whole note, -1 = half note, ...
      /* const durationType = */ this.cursor.nextNumber(NumberType.Int8);

      // duration = 1 << (4 - Math.max(4, durationType)); // TODO understand the max duration
      /* const tuplet = */ this.cursor.nextNumber(NumberType.Uint8);
    }

    let dynamic;
    if (hasNoteDynamic) {
      dynamic = this.readNoteDynamic();
    }

    let fret = 0;
    if (hasNoteType) {
      fret = this.cursor.nextNumber(NumberType.Uint8);
    }

    if (hasFingering) {
      /* const leftHandFingering = */ this.cursor.nextNumber(NumberType.Uint8);
      /* const rightHandFingering = */ this.cursor.nextNumber(NumberType.Uint8);
    }

    const noteOptions: NoteOptions = {
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
      const effects = this.readNoteEffects();
      if (effects.graceNote) {
        noteOptions.graceNote = new Note({
          pitch: stringTuning.adjust(fret),
          value: effects.graceNote.value,
          dynamic: effects.graceNote.dynamic,
        });
      }

      Object.assign(noteOptions, omit(effects, "graceNote"));
    }

    return noteOptions;
  }

  readNoteEffects(): NoteEffects {
    let vibrato = false;
    let letRing = false;
    let palmMute = false;
    let staccato = false;
    let bend: Bend | undefined;
    let slide: Slide | undefined;
    let harmonic: HarmonicStyle | undefined;
    let tremoloPicking: NoteValue | undefined;
    let hammerOnPullOff: boolean | undefined;
    let graceNote: GraceNote | undefined;

    if (this.version < 4) {
      const bits1 = bits(this.cursor.nextNumber(NumberType.Uint8));

      // TODO show grace notes
      // TODO show staccato

      let _unused, hasGraceNote, hasSlide, hasBend;
      [_unused, _unused, _unused, hasGraceNote, letRing, hasSlide, hammerOnPullOff, hasBend] = bits1;

      if (hasBend) {
        bend = this.readBend();
        console.info(bend);
      }

      if (hasGraceNote) {
        graceNote = this.readGraceNote();
      }

      if (hasSlide) {
        // upwards figured out in post process, v3 doesn't support slide types
        slide = { type: SlideType.LegatoSlide, upwards: true };
      }
    } else {
      const bits1 = bits(this.cursor.nextNumber(NumberType.Uint8));
      const bits2 = bits(this.cursor.nextNumber(NumberType.Uint8));

      let _unused, hasGraceNote, hasBend, hasTrill, hasHarmonics, hasSlide, hasTremoloPicking;
      [_unused, _unused, _unused, hasGraceNote, letRing, _unused, hammerOnPullOff, hasBend] = bits1;
      [_unused, vibrato, hasTrill, hasHarmonics, hasSlide, hasTremoloPicking, palmMute, staccato] = bits2;

      if (hasBend) {
        bend = this.readBend();
      }

      if (hasGraceNote) {
        graceNote = this.readGraceNote();
      }

      if (hasTremoloPicking) {
        tremoloPicking = this.readTremoloPicking();
      }

      if (hasSlide) {
        slide = this.readSlide();
      }

      if (hasHarmonics) {
        harmonic = this.readHarmonics();
      }

      if (hasTrill) {
        /* const fret = */ this.cursor.nextNumber(NumberType.Uint8);
        /* const period = */ this.cursor.nextNumber(NumberType.Uint8);
      }
    }

    return {
      letRing,
      palmMute,
      staccato,
      vibrato,
      bend,
      slide,
      harmonic,
      tremoloPicking,
      hammerOnPullOff,
      graceNote,
    };
  }

  readTremoloPicking() {
    const duration = this.cursor.nextNumber(NumberType.Uint8);
    switch (duration) {
      case 1:
        return new NoteValue(NoteValueName.Eighth);
      case 2:
        return new NoteValue(NoteValueName.Sixteenth);
      case 3:
        return new NoteValue(NoteValueName.ThirtySecond);
      default:
        throw new Error(`unknown tremolo picking value: ${duration}`);
    }
  }

  readSlide() {
    let type: SlideType | undefined;
    let upwards: boolean | undefined;

    const slideStyle = this.cursor.nextNumber(NumberType.Int8);
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

    if (!type) {
      return undefined;
    }

    return { type, upwards: !!upwards };
  }

  readHarmonics(): HarmonicStyle | undefined {
    const harmonicStyle = this.cursor.nextNumber(NumberType.Uint8);
    switch (harmonicStyle) {
      case 0:
        return undefined;
      case 1:
        return HarmonicStyle.Natural;
      case 3:
        return HarmonicStyle.Tapped;
      case 4:
        return HarmonicStyle.Pinch;
      case 5:
        return HarmonicStyle.Semi;
      case 15:
        return HarmonicStyle.ArtificialPlus5;
      case 17:
        return HarmonicStyle.ArtificialPlus7;
      case 22:
        return HarmonicStyle.ArtificialPlus12;
      default:
        console.warn(`Unknown harmonic style: ${harmonicStyle}`);
    }
  }

  readChordDiagram(): ChordDiagram {
    // TODO I don't think this works for gp3

    /* const version = */ this.cursor.nextNumber(NumberType.Uint8);
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
    this.debug({ numCommentLines });
    return range(numCommentLines).map(() => {
      return this.cursor.nextLengthPrefixedString(NumberType.Uint32);
    });
  }

  readLyrics() {
    if (this.version < 4) {
      return;
    }

    this.debug("lyrics");

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
          volume: volume / 16.0,
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
        return;
      case 1:
        // TODO always 1 for v3, so the type would have to be derived from the points
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
        throw new Error(`Unknown bend type value @ ${this.cursor.position.toString(16)}: ${bendTypeValue}`);
    }

    const amplitude = this.cursor.nextNumber(NumberType.Uint32) / 100.0;
    const numPoints = this.cursor.nextNumber(NumberType.Uint32);
    const points = range(numPoints).map((_) => {
      const time = this.cursor.nextNumber(NumberType.Uint32) / 60.0;
      const pointAmplitude = this.cursor.nextNumber(NumberType.Uint32) / (100.0 * amplitude);

      // 0 = none, 1 = fast, 2 = average, 3 = slow
      const vibrato = this.cursor.nextNumber(NumberType.Uint8);

      return { time, amplitude: pointAmplitude, vibrato };
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
    try {
      let versionNumber = Number.NaN;
      if (execResult) {
        versionNumber = parseInt(execResult[1] ?? "");
      }

      if (!Number.isFinite(versionNumber)) {
        throw new Error(`Unsupported Guitar Pro version: ${version})`);
      }

      return versionNumber;
    } finally {
      this.cursor.skip(30 - version.length);
    }
  }

  readNoteDynamic() {
    const dynamicValue = this.cursor.nextNumber(NumberType.Uint8);
    switch (dynamicValue) {
      case 1:
        return NoteDynamic.Pianississimo;
      case 2:
        return NoteDynamic.Pianissimo;
      case 3:
        return NoteDynamic.Piano;
      case 4:
        return NoteDynamic.MezzoPiano;
      case 5:
        return NoteDynamic.MezzoForte;
      case 6:
        return NoteDynamic.Forte;
      case 7:
        return NoteDynamic.Fortissimo;
      case 8:
        return NoteDynamic.Fortississimo;
      default:
        console.warn(`Unknown dynamic value: ${dynamicValue}`);
    }
  }

  readGraceNote(): GraceNote {
    const fret = this.cursor.nextNumber(NumberType.Uint8);
    const dynamic = this.readNoteDynamic();
    const transition = this.cursor.nextNumber(NumberType.Uint8);
    // 0 - None, 1 - Slide, 2 - Bend, 3 - Hammer on / pull off

    const durationValue = this.cursor.nextNumber(NumberType.Uint8);
    let value: NoteValue;
    switch (durationValue) {
      case 1:
        value = NoteValue.fromNumber(32);
        break;
      case 2:
        // TODO need to support "24th" in NoteValue
        value = NoteValue.fromNumber(32);
        break;
      case 3:
        value = NoteValue.fromNumber(16);
        break;
      default:
        throw new Error(`unsupported value for grace note duration: ${durationValue}`);
    }

    return {
      fret,
      value,
      dynamic,
      transition,
    };
  }

  debug(msg: unknown) {
    debug && console.debug(`@ 0x${this.cursor.position.toString(16).toUpperCase()}`, msg);
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
