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
    frets: number[];
    barres: Barre[];
  };
}

export interface Chord {
  rest: boolean;
  value: NoteValue;
  notes: Note[];
  text?: string;
  chordDiagram?: ChordDiagram;
}
