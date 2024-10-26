import { makeAutoObservable } from "mobx";
import { Note, NoteOptions } from "./Note";
import { NoteValue } from "./NoteValue";
import { initArray } from "./utils";

export interface Barre {
  baseFret: number;
  firstString: number;
  lastString: number;
}

export interface ChordDiagram {
  name: string;
  diagram?: {
    baseFret: number;
    frets: (number | undefined)[];
    barres: Barre[];
  };
}

export enum StrokeDirection {
  Up = "Up",
  Down = "Down",
}

export enum TapStyle {
  Tap = "Tap",
  Slap = "Slap",
  Pop = "Pop",
}

export interface Stroke {
  direction: StrokeDirection;
  duration?: NoteValue;
}

export interface ChordOptions {
  value: NoteValue;
  notes?: NoteOptions[];
  text?: string;
  tapped?: TapStyle;
  stroke?: Stroke;
  chordDiagram?: ChordDiagram;
}

export class Chord {
  private value_: NoteValue;
  private notes_: Note[];
  private text_: string | undefined;
  private tapped_: TapStyle | undefined;
  private stroke_: Stroke | undefined;
  private chordDiagram_: ChordDiagram | undefined;

  constructor(options: ChordOptions) {
    this.value_ = NoteValue.fromJSON(options.value);
    this.notes_ = initArray(Note, options.notes);
    this.text_ = options.text;
    this.tapped_ = options.tapped;
    this.stroke_ = options.stroke;
    this.chordDiagram_ = options.chordDiagram;

    makeAutoObservable(this, undefined, { deep: true });

    this.notes_.forEach((note) => Note.track(note));
  }

  get value() {
    return this.value_;
  }

  get notes(): ReadonlyArray<Note> {
    return this.notes_;
  }

  get text() {
    return this.text_;
  }

  get tapped() {
    return this.tapped_;
  }

  get stroke() {
    return this.stroke_;
  }

  get chordDiagram() {
    return this.chordDiagram_;
  }

  get rest() {
    return this.notes_.length == 0;
  }

  setValue(value: NoteValue) {
    this.value_ = value;
  }

  removeNote(note: Note): Note | undefined {
    if (note.placement) {
      return this.removeNoteByString(note.placement.string);
    }

    const existingIndex = this.notes.findIndex((n) => n == note);
    if (existingIndex >= 0) {
      const removed = this.notes_.splice(existingIndex, 1);
      Note.untrack(removed[0].id);
      return removed[0];
    }

    return undefined;
  }

  removeNoteByString(string: number): Note | undefined {
    const existingIndex = this.notes.findIndex((n) => n.placement?.string == string);
    if (existingIndex >= 0) {
      const removed = this.notes_.splice(existingIndex, 1);
      Note.untrack(removed[0].id);
      return removed[0];
    }

    return undefined;
  }

  noteByString(string: number): Note | undefined {
    return this.notes.find((n) => n.placement?.string == string);
  }

  changeNote(note: Note | NoteOptions): Note | undefined {
    const existingIndex = this.notes.findIndex((n) => n.placement?.string == note.placement?.string);
    if (existingIndex >= 0) {
      const existing = this.notes[existingIndex];

      // If we're swapping out the note, maintain the same id so we don't break any ties
      const chordNote = new Note({
        ...note,
        tie: note.tie, // TODO make it so this is part of the spread
        id: existing.id,
      });

      this.notes_[existingIndex] = chordNote;

      Note.swap(chordNote);

      return existing;
    }

    const chordNote = new Note({
      ...(note instanceof Note ? note.toJSON() : note),
      tie: note.tie, // TODO make it so this is part of the spread
    });
    Note.track(chordNote);
    this.notes_.push(chordNote);

    return undefined;
  }

  toJSON() {
    return {
      value: this.value_,
      notes: this.notes_,
      text: this.text_,
      tapped: this.tapped_,
      stroke: this.stroke_,
      chordDiagram: this.chordDiagram_,
    };
  }
}
