import { Note } from "./note";
import { NoteValue } from "./note_value";

export interface Chord {
  rest: boolean;
  value: NoteValue;
  notes: Note[];
  text?: string;
}
