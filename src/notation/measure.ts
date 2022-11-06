import { Chord } from "./chord";
import { StaffDetails } from "./staff";

export interface Marker {
  text: string;
  color: string; // RGB, encoded as hex string
}

export interface Measure {
  staffDetails: StaffDetails;
  marker?: Marker;
  /** 1-indexed number for this measure */
  number: number;
  chords: Chord[];
}
