import { Bend } from "./Bend";
import { Chord } from "./Chord";
import { NoteValue } from "./NoteValue";
import { Pitch } from "./Pitch";

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
  graceNote?: NoteOptions;
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

  public pitch: Pitch;
  public value: NoteValue;

  public placement: Placement | undefined;
  public accent_: AccentStyle | undefined;
  public bend: Bend | undefined;
  public dead: boolean;
  public dynamic_: NoteDynamic | undefined;
  public ghost_: boolean;
  public graceNote: Note | undefined;
  public hammerOnPullOff: boolean;
  public harmonic_: HarmonicStyle | undefined;
  public letRing_: boolean;
  public palmMute: boolean;
  public slide: Slide | undefined;
  public staccato: boolean;
  public tie: Tie | undefined;
  public tremoloPicking_: NoteValue | undefined;
  public vibrato_: boolean;

  constructor(options: NoteOptions) {
    this.pitch = Pitch.fromJSON(options.pitch);
    this.value = new NoteValue(options.value.name, options.value);

    this.placement = options.placement;
    this.accent_ = options.accent;
    this.bend = options.bend;
    this.dead = !!options.dead;
    this.dynamic_ = options.dynamic;
    this.ghost_ = !!options.ghost;
    this.graceNote = options.graceNote && new Note(options.graceNote);
    this.hammerOnPullOff = !!options.hammerOnPullOff;
    this.harmonic_ = options.harmonic;
    this.letRing_ = !!options.letRing;
    this.palmMute = !!options.palmMute;
    this.slide = options.slide;
    this.staccato = !!options.staccato;
    this.tie = options.tie;
    this.tremoloPicking_ = options.tremoloPicking && new NoteValue(options.tremoloPicking.name, options.tremoloPicking);
    this.vibrato_ = !!options.vibrato;

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

  get vibrato(): boolean {
    return !!this.get("vibrato_");
  }

  get letRing(): boolean {
    return !!this.get("letRing_");
  }

  get tremoloPicking(): NoteValue | undefined {
    return this.get("tremoloPicking_") as NoteValue | undefined;
  }

  get ghost(): boolean {
    return !!this.get("ghost_");
  }

  get harmonic(): HarmonicStyle | undefined {
    return this.get("harmonic_") as HarmonicStyle | undefined;
  }

  get accent(): AccentStyle | undefined {
    return this.get("accent_") as AccentStyle | undefined;
  }

  get dynamic(): NoteDynamic | undefined {
    return this.get("dynamic_") as NoteDynamic | undefined;
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

  get rootTieNote(): Note {
    if (this.tie?.previous) {
      return this.tie.previous.rootTieNote;
    }

    return this;
  }

  withChanges(changes: Partial<NoteOptions>): NoteOptions {
    return {
      ...this,
      ...changes,
    };
  }

  toString() {
    return this.text;
  }

  /**
   * Get an options attribute for this note.
   *
   * If the attribute isn't defined, and this note is a middle/end tie, try the note it is
   * linked to to see if it has the attribute.
   *
   * If fromStart, force fetching the property from the starting note for the tie.
   */
  protected get<T extends keyof Note>(property: T, fromStart = false): unknown {
    if (!fromStart || !this.tie || this.tie.type == "start") {
      const v = this[property];
      if (v) {
        return v;
      }
    }

    if (this.tie?.previous) {
      return this.tie.previous.get(property, fromStart);
    }
  }
}

export interface Placement {
  fret: number;
  string: number;
}
