import { makeAutoObservable } from "mobx";
import { Measure } from "./Measure";
import { Instrument } from "./instruments/Instrument";

export interface PartOptions {
  name: string;
  measures: Measure[];
  lineCount: number;

  color?: string;
  instrument?: Instrument;
}

export class Part {
  constructor(private options: PartOptions) {
    makeAutoObservable(this, undefined, { deep: true });
  }

  get name() {
    return this.options.name;
  }

  get measures() {
    return this.options.measures;
  }

  get lineCount() {
    return this.options.lineCount;
  }

  get color() {
    return this.options.color;
  }

  get instrument() {
    return this.options.instrument;
  }
}
