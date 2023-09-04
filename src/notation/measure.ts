import { Chord } from "./chord";
import { StaffDetails } from "./staff";

export interface Marker {
  text: string;
  color: string; // RGB, encoded as hex string
}

interface MeasureOptions {
  /** 1-indexed number for this measure */
  number: number;
  chords: Chord[];
  staffDetails: StaffDetails;

  marker?: Marker;
}

export class Measure {
  constructor(private options: MeasureOptions) {}

  get number() {
    return this.options.number;
  }

  get chords() {
    return this.options.chords;
  }

  get staffDetails() {
    return this.options.staffDetails;
  }

  get marker() {
    return this.options.marker;
  }
}
