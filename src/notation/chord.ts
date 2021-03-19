import { Duration } from "./duration";
import { Note } from "./note";

export interface Chord {
  rest: boolean;
  duration: Duration;
  notes: Note[];
}
