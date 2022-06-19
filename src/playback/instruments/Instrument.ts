import { Note } from "../../notation";

export interface Instrument {
  playNote(note: Note): void;
}
