import { computed, makeObservable, observable } from "mobx";

export type InstrumentOptions = {
  /** MIDI preset # for the instrument */
  midiPreset: number;

  /** Volume the instrument should be played back at (between 0 and 1) */
  volume: number;
};

export abstract class Instrument<OptionsT extends InstrumentOptions = InstrumentOptions> {
  constructor(readonly options: OptionsT) {
    makeObservable(this, {
      options: observable.deep,
      midiPreset: computed,
      volume: computed,
    });
  }

  get midiPreset() {
    return this.options.midiPreset;
  }

  get volume() {
    return this.options.volume;
  }
}
