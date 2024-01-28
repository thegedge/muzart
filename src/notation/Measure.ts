import { makeAutoObservable } from "mobx";
import { Chord } from "./Chord";
import { TimeSignature } from "./TimeSignature";
import { Changeable, StaffDetails } from "./staff";

export interface Marker {
  text: string;
  color: string; // RGB, encoded as hex string
}

export interface Repeat {
  /** Whether this measure is the start of a repeat section */
  start: boolean;

  /** The number of repeats, if this measure is the end of a repeat section */
  count: number;

  /** Which alternate ending this measure acts as in a repeat section */
  alternateEndingNumber: number;
}

interface MeasureOptions {
  /** 1-indexed number for this measure */
  number: number;
  chords: Chord[];

  /** Various staff-level details that can change on a per-measure basis */
  staffDetails: StaffDetails;

  /** Repeat information for this measure */
  repeat?: Repeat;

  /** A piece of text to identify this measure (e.g., intro, chorus, solo) */
  marker?: Marker;
}

export class Measure {
  constructor(private options: MeasureOptions) {
    if (options.repeat) {
      console.log(options.repeat);
    }
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

  setTimeSignature(timeSignature: Changeable<TimeSignature> | undefined) {
    this.staffDetails.time = timeSignature;
  }
}
