import { Note } from "../../notation";

export interface Instrument {
  /** Stop all actively playing notes */
  stop(): void;

  /** Play note at the given tempo */
  playNote(note: Note, tempo: number): void;

  /** Dispose all resources associated with this instrument */
  dispose(): void;
}
