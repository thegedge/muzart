import { Chord, StaffDetails } from ".";

export interface Measure {
  staveDetails?: StaffDetails[];
  chords: Chord[];
}
