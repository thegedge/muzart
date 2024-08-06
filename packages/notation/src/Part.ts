import { makeAutoObservable } from "mobx";
import { Instrument } from "./instruments/Instrument";
import { PercussionInstrument } from "./instruments/PercussionInstrument";
import { StringInstrument } from "./instruments/StringInstrument";
import { Measure } from "./Measure";
import { initArray, initPolyObject } from "./utils";

export interface PartOptions {
  name: string;
  measures?: Measure[];
  lineCount: number;
  color?: string;
  instrument: StringInstrument | PercussionInstrument;
}

export class Part {
  public name: string;
  public measures: Measure[];
  public lineCount: number;
  public color: string | undefined;
  public instrument: Instrument;

  constructor(options: PartOptions) {
    this.name = options.name;
    this.lineCount = options.lineCount;
    this.color = options.color;

    this.measures = initArray(Measure, options.measures);
    this.instrument = initPolyObject(
      {
        percussion: PercussionInstrument,
        string: StringInstrument,
      },
      options.instrument,
    );

    makeAutoObservable(this, undefined, { deep: true });
  }

  setName(name: string) {
    this.name = name;
  }

  toJSON() {
    return {
      name: this.name,
      measures: this.measures,
      lineCount: this.lineCount,
      color: this.color,
      instrument: this.instrument,
    };
  }
}
