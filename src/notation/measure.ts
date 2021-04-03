import { Chord } from "./chord";
import { StaffDetails } from "./staff";

export interface Measure {
  staffDetails: StaffDetails;
  marker?: {
    text: string;
    color: string; // RGB, encoded as hex string
  };
  number: number;
  chords: Chord[];
}
