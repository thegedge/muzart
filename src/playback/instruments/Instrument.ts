import { Note } from "../../notation";

export interface Instrument {
  dispose(): void;
  playNote(note: Note): void;
}
