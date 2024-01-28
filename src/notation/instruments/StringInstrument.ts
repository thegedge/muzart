import { computed, makeObservable } from "mobx";
import { Pitch } from "../pitch";
import { Instrument, InstrumentOptions } from "./Instrument";

export type StringInstrumentOptions = InstrumentOptions & {
  /** Tuning of the instrument strings */
  tuning: Pitch[];
};

export class StringInstrument extends Instrument<StringInstrumentOptions> {
  constructor(options: StringInstrumentOptions) {
    super(options);
    makeObservable(this, {
      tuning: computed,
    });
  }

  get tuning() {
    return this.options.tuning;
  }
}
