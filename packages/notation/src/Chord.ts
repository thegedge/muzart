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

  removeNote(note: Note) {
    const existingIndex = this.notes.findIndex((n) => n.placement?.string == note.placement?.string);
    if (existingIndex >= 0) {
      this.notes_.splice(existingIndex, 1);
      Note.untrack(note.id);
    }
  }

  setValue(value: NoteValue) {
    this.value_ = value;
  }

  noteByString(string: number): Note | undefined {
    return this.notes.find((n) => n.placement?.string == string);
  }

  changeNote(note: Note | NoteOptions): Note | undefined {
    const chordNote = new Note(note);

    Note.track(chordNote);

    const existingIndex = this.notes.findIndex((n) => n.placement?.string == chordNote.placement?.string);
    if (existingIndex >= 0) {
      const existing = this.notes[existingIndex];
      this.notes_[existingIndex] = chordNote;
      return existing;
    }

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
