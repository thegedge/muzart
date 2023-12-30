import { Bend } from "./Bend";
import { Chord } from "./Chord";
import { NoteValue } from "./NoteValue";
import { Pitch } from "./pitch";

export type TieType = "start" | "stop" | "middle";

export enum HarmonicStyle {
  Natural = "natural",
  ArtificialPlus5 = "artificial+5",
  ArtificialPlus7 = "artificial+7",
  ArtificialPlus12 = "artificial+12",
  Tapped = "tapped",
  Pinch = "pinch",
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

export enum SlideType {
  SlideIntoFromAbove = "Slide into from above",
  SlideIntoFromBelow = "Slide into from below",
  // TODO need to post process to figure out if we're sliding up or down for these two
  ShiftSlide = "Shift slide",
  LegatoSlide = "Legato slide",
  SlideOutDownwards = "Slide out of downwards",
  SlideOutUpwards = "Slide out of upwards",
}

export interface Slide {
  type: SlideType;

  /** If true, slide moves upwards. Downwards, otherwise. */
  upwards: boolean;
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

  accent?: AccentStyle;
  bend?: Bend;
  dead?: boolean;
  dynamic?: NoteDynamic;
  ghost?: boolean;
  graceNote?: Note;
  hammerOnPullOff?: boolean;
  harmonic?: HarmonicStyle;
  letRing?: boolean;
  palmMute?: boolean;
  slide?: Slide;
  staccato?: boolean;
  tie?: Tie;
  tremoloPicking?: NoteValue;
  vibrato?: boolean;
}

export class Note {
  private text: string;

  constructor(readonly options: NoteOptions) {
    this.text = (() => {
      let text;
      if (this.dead) {
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
    })();
  }

  get pitch() {
    return this.options.pitch;
  }

  get value() {
    return this.options.value;
  }

  get placement() {
    return this.options.placement;
  }

  get tie() {
    return this.options.tie;
  }

  get bend() {
    return this.options.bend;
  }

  get slide() {
    return this.options.slide;
  }

  get vibrato() {
    return this.get("vibrato");
  }

  get letRing() {
    return this.get("letRing");
  }

  get tremoloPicking() {
    return this.get("tremoloPicking");
  }

  get dead() {
    return !!this.options.dead;
  }

  get ghost() {
    return this.get("ghost");
  }

  get harmonic() {
    return this.get("harmonic");
  }

  get accent() {
    return this.get("accent");
  }

  get palmMute() {
    return !!this.options.palmMute;
  }

  get staccato() {
    return !!this.options.staccato;
  }

  get dynamic() {
    return this.get("dynamic");
  }

  get hammerOnPullOff() {
    return !!this.options.hammerOnPullOff;
  }

  get graceNote() {
    return this.options.graceNote;
  }

  get harmonicString() {
    if (!this.harmonic) {
      return "";
    }

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
      case HarmonicStyle.Pinch:
        return "P.H.";
      case HarmonicStyle.Semi:
        return "S.H.";
    }
  }

  withChanges(changes: Partial<NoteOptions>) {
    return new Note({
      ...this.options,
      ...changes,
    });
  }

  toString() {
    return this.text;
  }

  get rootTieNote(): Note {
    if (this.tie?.previous) {
      return this.tie.previous.rootTieNote;
    }

    return this;
  }

  /**
   * Get an options attribute for this note.
   *
   * If the attribute isn't defined, and this note is a middle/end tie, try the note it is
   * linked to to see if it has the attribute.
   *
   * If fromStart, force fetching the property from the starting note for the tie.
   */
  get<T extends keyof NoteOptions>(property: T, fromStart = false): NoteOptions[T] | undefined {
    if (!fromStart || !this.options.tie || this.options.tie?.type == "start") {
      const v = this.options[property];
      if (v) {
        return v;
      }
    }

    if (this.options.tie?.previous) {
      return this.options.tie.previous.get(property, fromStart);
    }
  }
}

export interface Placement {
  fret: number;
  string: number;
}
