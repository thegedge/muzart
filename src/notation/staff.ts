import { Pitch } from "./pitch";

export interface StaffDetails {
  lineCount: number;
  divisions: number;
  key?: Key;
  clef?: Clef;
  tuning?: Pitch[];
  time?: TimeSignature;
  tempo?: number;
}

export interface Key {
  fifths: number;
  mode?: KeyMode;
}

export type KeyMode =
  | "major"
  | "minor"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "ionian"
  | "locrian"
  | "none";

export interface Clef {
  sign: ClefSign;
  line: number;
}

export type ClefSign = "G" | "F" | "C" | "percussion" | "TAB" | "jianpu" | "none";

export interface TimeSignature {
  beats: number;
  beatType: number;
}
