import { makeAutoObservable } from "mobx";
import { Chord } from "./Chord";
import { TimeSignature } from "./TimeSignature";
import { Changeable, StaffDetails } from "./staff";
import { initArray } from "./utils";

export interface Marker {
  text: string;
  color: string; // RGB, encoded as hex string
}

interface MeasureOptions {
  /** 1-indexed number for this measure */
  number: number;
  chords?: Chord[];
  staffDetails: StaffDetails;
  marker?: Marker;
}

export class Measure {
  public number: number;
  public chords: Chord[];
  public staffDetails: StaffDetails;
  public marker: Marker | undefined;

  constructor(options: MeasureOptions) {
    this.number = options.number;
    this.chords = initArray(Chord, options.chords);
    this.staffDetails = {
      ...options.staffDetails,
      time: options.staffDetails.time && {
        changed: options.staffDetails.time.changed,
        value: TimeSignature.fromJSON(options.staffDetails.time.value),
      },
    };
    this.marker = options.marker;
    makeAutoObservable(this, undefined, { deep: true });
  }

  get isValid() {
    if (!this.staffDetails.time) {
      return false;
    }
    const measureDuration = this.chords.reduce((sum, chord) => sum + chord.value.toDecimal(), 0);
    const expectedDuration = this.staffDetails.time.value.toDecimal();
    return Math.abs(measureDuration - expectedDuration) < 1e-10;
  }

  addChord(chord: Chord) {
    this.chords.push(chord);
  }

  removeChord(chord: Chord) {
    const index = this.chords.indexOf(chord);
    if (index >= 0) {
      this.chords.splice(index, 1);
    }
  }

  setTimeSignature(timeSignature: Changeable<TimeSignature> | undefined) {
    this.staffDetails.time = timeSignature;
  }

  toJSON() {
    return {
      number: this.number,
      chords: this.chords,
      staffDetails: this.staffDetails,
      marker: this.marker,
    };
  }
}
