import { makeAutoObservable } from "mobx";
import { Chord } from "./Chord";
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
  constructor(private options: MeasureOptions) {
    makeAutoObservable(this, undefined, { deep: true });
  }

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

  get isValid() {
    const measureDuration = this.chords.reduce((sum, chord) => sum + chord.value.toDecimal(), 0);
    const expectedDuration = this.staffDetails.time!.value.toDecimal();
    return Math.abs(measureDuration - expectedDuration) < 1e-10;
  }
}
