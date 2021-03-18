export interface Changeable<T> {
  value: T;
  changed: boolean;
}
export interface StaffDetails {
  key?: Changeable<Key>;
  clef?: Changeable<Clef>;
  time?: Changeable<TimeSignature>;
  tempo?: Changeable<number>;
}

export function changed<T>(newValue: T | undefined, previousValue: T): Changeable<T> {
  return {
    value: newValue || previousValue,
    changed: !!newValue && newValue !== previousValue,
  };
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
