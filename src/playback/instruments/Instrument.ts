import { Note } from "../../notation";

export interface Instrument {
  stop(): void;
  playNote(note: Note, tempo: number): void;
  dispose(): void;
}
