import { pickBy } from "lodash";
import { Chord } from "./chord";
import { NoteValue } from "./note_value";
import { Pitch } from "./pitch";

export type TieType = "start" | "stop" | "middle";

export enum HarmonicStyle {
  Natural = "natural",
  ArtificialPlus5 = "artificial+5",
  ArtificialPlus7 = "artificial+7",
  ArtificialPlus12 = "artificial+12",
  Tapped = "tapped",
  Pitch = "pitch",
  Semi = "semi",
}

export enum AccentStyle {
  Accentuated = "accentuated",
  Marcato = "marcato",
}

export enum NoteDynamic {
  Pianississimo = "ppp",
  Pianissimo = "pp",
  Piano = "p",
  MezzoPiano = "mp",
  MezzoForte = "mf",
  Forte = "f",
  Fortissimo = "ff",
  Fortississimo = "fff",
}

export enum BendType {
  // Regular
  Bend = "Bend",
  BendRelease = "Bend and Release",
  BendReleaseBend = "Bend and Release and Bend",
  Prebend = "Prebend",
  PrebendRelease = "Prebend and Release",

  // Tremolo bar
  Dip = "Dip",
  Dive = "Dive",
  ReleaseUp = "Release (up)",
  InvertedDip = "Inverted Dip",
  Return = "Return",
  ReleaseDown = "Release (down)",
}

export interface Bend {
  type: BendType;

  /** The overall amplitude of the bend, measured in tones (i.e., 1 is a full bend, 0.5 is a half bend) */
  amplitude: number;
}

export interface Tie {
  type: TieType;
  previous?: Note;
  previousChord?: Chord;
  next?: Note;
  nextChord?: Chord;
}

export interface NoteOptions {
  pitch: Pitch;
  value: NoteValue;
  placement?: Placement;

  bend?: Bend;
  vibrato?: boolean;
  deadNote?: boolean;
  tie?: Tie;
  letRing?: boolean;
  ghost?: boolean;
  harmonic?: HarmonicStyle;
  accent?: AccentStyle;
  palmMute?: boolean;
  staccato?: boolean;
  dynamic?: NoteDynamic;
}

export class Note {
  readonly pitch!: Pitch;
  readonly value!: NoteValue;
  readonly placement?: Placement;

  public tie?: Tie;
  readonly bend?: Bend;
  readonly vibrato?: boolean;
  readonly letRing?: boolean;
  readonly deadNote?: boolean;
  readonly ghost?: boolean;
  readonly harmonic?: HarmonicStyle;
  readonly accent?: AccentStyle;
  readonly palmMute?: boolean;
  readonly staccato?: boolean;
  readonly dynamic?: NoteDynamic;

  constructor(options: NoteOptions) {
    Object.assign(
      this,
      pickBy(options, (value, key) => value && key in this)
    );
  }

  get harmonicString() {
    if (!this.harmonic) {
      return "";
    }

    // TODO verify all of these make sense
    switch (this.harmonic) {
      case HarmonicStyle.Natural:
        return "N.H.";
      case HarmonicStyle.ArtificialPlus5:
        return "A.H.";
      case HarmonicStyle.ArtificialPlus7:
        return "A.H.";
      case HarmonicStyle.ArtificialPlus12:
        return "A.H.";
      case HarmonicStyle.Tapped:
        return "T.H.";
      case HarmonicStyle.Pitch:
        return "P.H.";
      case HarmonicStyle.Semi:
        return "S.H.";
    }
  }

  toString() {
    let text;
    if (this.deadNote) {
      text = "x";
    } else if (this.tie && this.tie.previous) {
      text = "";
    } else if (this.placement) {
      text = this.placement.fret.toString();
    } else {
      return "";
    }

    if (this.ghost) {
      text = `(${text})`;
    }

    return text;
  }
}

export interface Placement {
  fret: number;
  string: number;
}
