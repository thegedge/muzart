import { pickBy } from "lodash";
import { NoteValue } from "./note_value";
import { Pitch } from "./pitch";

export type TieType = "start" | "stop";

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

export interface NoteOptions {
  pitch: Pitch;
  value: NoteValue;
  placement?: Placement;
  deadNote?: boolean;
  tie?: TieType;
  ghost?: boolean;
  harmonic?: HarmonicStyle;
  accent?: AccentStyle;
}

export class Note {
  readonly pitch!: Pitch;
  readonly value!: NoteValue;
  readonly placement?: Placement;
  readonly tie?: TieType;
  readonly deadNote?: boolean;
  readonly ghost?: boolean;
  readonly harmonic?: HarmonicStyle;
  readonly accent?: AccentStyle;

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
    } else if (this.tie === "stop") {
      text = ".";
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
