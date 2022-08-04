import { Chord } from "./chord";
import { StaffDetails } from "./staff";

export interface Marker {
  text: string;
  color: string; // RGB, encoded as hex string
}

export interface Measure {
  staffDetails: StaffDetails;
  marker?: Marker;
  number: number;
  chords: Chord[];
}
