import { nanoid } from "nanoid/non-secure";
import { Bend } from "./Bend";
import { Chord } from "./Chord";
import { NoteValue } from "./NoteValue";
import { Pitch } from "./Pitch";

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

export type TieOptions = {
  previous?: TiePoint | "detect";
  next?: TiePoint;
};

export type Tie =
  | {
      type: "start";
      previous?: never;
      next: TiePoint;
    }
  | {
      type: "middle";
      previous: TiePoint;
      next: TiePoint;
    }
  | {
      type: "stop";
      previous: TiePoint;
      next?: never;
    }
  | {
      type: "detect";
      previous?: never;
      next?: never;
    };
export class TiePoint {
  public noteId!: string;

  constructor(
    readonly chord: Chord,
    noteOrNoteId: Note | string,
  ) {
    this.note = noteOrNoteId;
  }

  set note(noteOrNoteId: Note | string) {
    this.noteId = typeof noteOrNoteId === "string" ? noteOrNoteId : noteOrNoteId.id;
  }

  get note(): Note {
    return Note.resolve(this.noteId);
  }

  toJSON() {
    return {
      chord: this.chord,
      note: this.noteId,
    };
  }
}

class TieInternal {
  private previous_: TiePoint | "detect" | undefined;
  private next_: TiePoint | undefined;

  constructor(options: TieOptions) {
    this.previous_ = options.previous;
    this.next_ = options.next;
  }

  get type(): "start" | "middle" | "stop" | "unknown" {
    const hasPrevious = !!this.previous;
    const hasNext = !!this.next;
    if (hasPrevious && hasNext) {
      return "middle";
    } else if (hasPrevious) {
      return "stop";
    } else if (hasNext) {
      return "start";
    } else {
      return "unknown";
    }
  }

  get previous(): TiePoint | undefined {
    if (!this.previous_ || this.previous_ == "detect" || !Note.tracked(this.previous_.noteId)) {
      return undefined;
    }
    return this.previous_;
  }

  get next(): TiePoint | undefined {
    if (!this.next_ || !Note.tracked(this.next_.note.id)) {
      return undefined;
    }
    return this.next_;
  }

  toJSON() {
    return {
      previous: this.previous_ === "detect" ? "detect" : this.previous_?.toJSON(),
      next: this.next_?.toJSON(),
    };
  }
}

export interface NoteOptions {
  id?: string;

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
  tie?: TieOptions;
  tremoloPicking?: NoteValue;
  vibrato?: boolean;
}

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export class Note {
  private static noteMapping = new Map<string, WeakRef<Note>>();

  static track(note: Note): void {
    const existing = this.noteMapping.get(note.id);
    if (!existing) {
      this.noteMapping.set(note.id, new WeakRef(note));
    } else if (existing.deref() !== note) {
      throw new Error("two notes have the same id");
    }
  }

  static swap(note: Note): void {
    this.noteMapping.set(note.id, new WeakRef(note));
  }

  static untrack(noteId: string): void {
    this.noteMapping.delete(noteId);
  }

  static clear(): void {
    this.noteMapping.clear();
  }

  static tracked(id: string): boolean {
    return this.noteMapping.has(id);
  }

  static resolve(id: string): Note {
    const note = this.noteMapping.get(id)?.deref();
    if (!note) {
      throw new Error(`Note with id ${id} not found`);
    }
    return note;
  }

  static id(): string {
    return nanoid();
  }

  public readonly id: string;
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
  public tie_: TieInternal | undefined;
  public tremoloPicking_: NoteValue | undefined;
  public vibrato_: boolean;

  constructor(options: NoteOptions) {
    this.id = options.id || Note.id();
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
    this.tie_ = options.tie && new TieInternal(options.tie);
    this.tremoloPicking_ = options.tremoloPicking && new NoteValue(options.tremoloPicking.name, options.tremoloPicking);
    this.vibrato_ = !!options.vibrato;

    this.text = (() => {
      let text;
      if (this.dead) {
        text = "x";
      } else if (this.tie_ && this.tie_.previous) {
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

  set tie(tie: TieOptions) {
    if (!this.tie_ || !this.tie_.previous) {
      this.tie_ = new TieInternal(tie);
    }
    throw new Error("Cannot change note tie");
  }

  get tie(): Tie | undefined {
    return this.tie_ as Tie;
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
    if (this.tie_?.previous) {
      return this.tie_.previous.note.rootTieNote;
    }

    return this;
  }

  withChanges(changes: DeepPartial<NoteOptions>): NoteOptions {
    return {
      ...this,
      ...changes,
      id: undefined,
    };
  }

  toString() {
    return this.text;
  }

  toJSON(): Record<string, unknown> {
    // All these `|| undefined` reduce the size of the JSON output
    return {
      id: this.id,
      pitch: this.pitch.toJSON(),
      value: this.value.toJSON(),
      placement: this.placement,
      accent: this.accent,
      bend: this.bend,
      dead: this.dead || undefined,
      dynamic: this.dynamic,
      ghost: this.ghost || undefined,
      graceNote: this.graceNote?.toJSON(),
      hammerOnPullOff: this.hammerOnPullOff || undefined,
      harmonic: this.harmonic,
      letRing: this.letRing || undefined,
      palmMute: this.palmMute || undefined,
      slide: this.slide,
      staccato: this.staccato || undefined,
      tie: this.tie_?.toJSON(),
      tremoloPicking: this.tremoloPicking,
    };
  }

  /**
   * Get an options attribute for this note.
   *
   * If the attribute isn't defined, and this note is a middle/end tie, try the note it is
   * linked to to see if it has the attribute.
   *
   * If fromStart, force fetching the property from the starting note for the tie.
   */
  protected get(property: keyof Note, fromStart = false): unknown {
    if (!fromStart || !this.tie_ || this.tie_.type == "start") {
      const v = this[property];
      if (v) {
        return v;
      }
    }

    if (this.tie_?.previous) {
      return this.tie_.previous.note.get(property, fromStart);
    }
  }
}

export interface Placement {
  fret: number;
  string: number;
}
