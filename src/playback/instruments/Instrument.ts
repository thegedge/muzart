import { Note } from "../../notation";

export interface Instrument {
  /** Stop all actively playing notes */
  stop(): void;

  /**
   * Play a given note on this instrument.
   *
   * @param [note] the note to play
   * @param [tempo] the tempo to play the note at
   * @param [startTimeFromNow] optional starting time, seconds from the current time
   * @param [ignoreTies] if true, only play the note for its own duration
   */
  playNote(note: Note, tempo: number, startTimeFromNow?: number, ignoreTies?: boolean): void;

  /** Dispose all resources associated with this instrument */
  dispose(): void;
}
