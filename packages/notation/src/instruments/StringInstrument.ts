import { makeObservable } from "mobx";
import { Pitch } from "../Pitch";
import { Instrument, InstrumentOptions } from "./Instrument";

export type StringInstrumentOptions = InstrumentOptions & {
  /** Tuning of the instrument strings */
  tuning: Pitch[];
};

export class StringInstrument extends Instrument<StringInstrumentOptions> {
  readonly type = "string";

  public tuning: Pitch[];

  constructor(options: StringInstrumentOptions) {
    super(options);

    this.tuning = options.tuning.map((pitch) => Pitch.fromJSON(pitch));

    makeObservable(this, {
      tuning: true,
    });
  }
}
