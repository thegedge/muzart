import { makeObservable } from "mobx";
import { Instrument, InstrumentOptions } from "./Instrument";

export interface PercussionInstrumentOptions extends InstrumentOptions {}

export class PercussionInstrument extends Instrument<PercussionInstrumentOptions> {
  constructor(options: PercussionInstrumentOptions) {
    super(options);
    makeObservable(this, {});
  }
}
