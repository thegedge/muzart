import { Chord } from "./note";
import { StaffDetails } from "./staff";

export interface Measure {
  staveDetails?: StaffDetails[];
  chords: Chord[];
}
