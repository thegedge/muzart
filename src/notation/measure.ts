import { Chord } from "./chord";
import { StaffDetails } from "./staff";

export interface Measure {
  staveDetails?: StaffDetails[];
  chords: Chord[];
}
