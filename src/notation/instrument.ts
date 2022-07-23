import { Pitch } from "./pitch";

export interface Instrument {
  /**
   * Type of instrument.
   *
   * regular: most instruments that can be played back via regular use of a soundfont instrument
   * drum: a percussion instrument, which generally needs special treatment for playback
   */
  type: "regular" | "percussion";

  /** MIDI preset # for the instrument */
  midiPreset: number;

  /** Tuning of the instrument strings */
  tuning?: Pitch[];

  /** Volume the instrument should be played back at (between 0 and 1) */
  volume: number;
}
