import { Note } from "../../notation";

export interface Instrument {
  stop(): void;
  playNote(note: Note): void;
  dispose(): void;
}
