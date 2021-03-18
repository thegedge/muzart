import { Chord } from "./chord";
import { StaffDetails } from "./staff";

export interface Measure {
  staffDetails: StaffDetails;
  number: number;
  chords: Chord[];
}
