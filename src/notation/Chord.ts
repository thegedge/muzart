import { makeAutoObservable } from "mobx";
import { Note, NoteOptions } from "./Note";
import { NoteValue } from "./note_value";

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
  notes: Note[];

  text?: string;
  tapped?: TapStyle;
  stroke?: Stroke;
  chordDiagram?: ChordDiagram;
}

export class Chord {
  constructor(private options: ChordOptions) {
    makeAutoObservable(this, undefined, { deep: true });
  }

  get value() {
    return this.options.value;
  }

  get notes() {
    return this.options.notes;
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
      this.notes.splice(existingIndex, 1);
    }
  }

  changeNote(changes: Partial<NoteOptions>): [Note | undefined, Note] {
    const existingIndex = this.notes.findIndex((n) => n.placement?.string == changes?.placement?.string);
    if (existingIndex >= 0) {
      const existing = this.notes[existingIndex];
      const note = existing.withChanges(changes);
      this.notes[existingIndex] = note;
      return [existing, note];
    }

    if (!changes.pitch) {
      throw new Error("must provide pitching when adding a new note");
    }

    const note = new Note({
      value: this.value,
      pitch: changes.pitch,
      ...changes,
    });
    this.notes.push(note);

    return [undefined, note];
  }
}