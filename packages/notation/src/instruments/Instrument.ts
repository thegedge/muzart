import { makeObservable } from "mobx";

export type InstrumentOptions = {
  /** MIDI preset # for the instrument */
  midiPreset: number;

  /** Volume the instrument should be played back at (between 0 and 1) */
  volume: number;
};

export abstract class Instrument<OptionsT extends InstrumentOptions = InstrumentOptions> {
  abstract readonly type: string;

  public midiPreset: number;
  public volume: number;

  constructor(options: OptionsT) {
    this.midiPreset = options.midiPreset;
    this.volume = options.volume;

    makeObservable(this, {
      midiPreset: true,
      volume: true,
    });
  }
}
