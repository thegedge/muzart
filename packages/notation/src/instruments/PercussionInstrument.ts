import { makeObservable } from "mobx";
import { Instrument, type InstrumentOptions } from "./Instrument";

export type PercussionInstrumentOptions = InstrumentOptions;

export class PercussionInstrument extends Instrument<PercussionInstrumentOptions> {
  readonly type = "percussion";

  constructor(options: PercussionInstrumentOptions) {
    super(options);
    makeObservable(this, {});
  }
}
