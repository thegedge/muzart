import { makeAutoObservable } from "mobx";
import { Note, NoteOptions } from "./Note";
import { NoteValue } from "./NoteValue";

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
  notes: NoteOptions[];

  text?: string;
  tapped?: TapStyle;
  stroke?: Stroke;
  chordDiagram?: ChordDiagram;
}

export class Chord {
  private notes_: Note[];

  constructor(private options: ChordOptions) {
    this.notes_ = options.notes.map((n) => new Note(this, n));
    makeAutoObservable(this, undefined, { deep: true });
  }

  get value() {
    return this.options.value;
  }

  get notes(): ReadonlyArray<Note> {
    return this.notes_;
  }

  get text() {
    return this.options.text;
  }

  get tapped() {
    return this.options.tapped;
  }

  get stroke() {
    return this.options.stroke;
  }

  get chordDiagram() {
    return this.options.chordDiagram;
  }

  get rest() {
    return this.options.notes.length == 0;
  }

  removeNote(note: Note) {
    const existingIndex = this.notes.findIndex((n) => n.placement?.string == note.placement?.string);
    if (existingIndex >= 0) {
      this.notes_.splice(existingIndex, 1);
    }
  }

  setValue(value: NoteValue) {
    this.options.value = value;
  }

  noteByString(string: number): Note | undefined {
    return this.notes.find((n) => n.placement?.string == string);
  }

  changeNote(note: Note | NoteOptions): Note | undefined {
    const chordNote = new Note(this, note instanceof Note ? note.options : note);
    const existingIndex = this.notes.findIndex((n) => n.placement?.string == chordNote.placement?.string);
    if (existingIndex >= 0) {
      const existing = this.notes[existingIndex];
      this.notes_[existingIndex] = chordNote;
      return existing;
    }

    this.notes_.push(chordNote);

    return undefined;
  }
}
