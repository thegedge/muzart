import { Note } from "./note";
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

export interface Stroke {
  direction: StrokeDirection;
  duration?: NoteValue;
}

export interface Chord {
  rest: boolean;
  value: NoteValue;
  notes: Note[];
  text?: string;
  stroke?: Stroke;
  chordDiagram?: ChordDiagram;
}
