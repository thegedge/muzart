import { Note } from "../../notation";

export interface Instrument {
  /** Stop all actively playing notes */
  stop(): void;

  /**
   * Play note at the given tempo
   *
   * Optionally, can start the note playback at a given number of seconds from the current time.
   */
  playNote(note: Note, tempo: number, startTimeFromNow?: number): void;

  /** Dispose all resources associated with this instrument */
  dispose(): void;
}
