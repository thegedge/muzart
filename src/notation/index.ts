import { isArray } from "lodash";

export interface Score {
  title?: string;
  composer?: string;
  parts: Part[];
}

export interface Part {
  name?: string;
  measures: Measure[];
}

export interface Measure {
  staveDetails?: StaffDetails[];
  chords: Chord[];
}

export interface StaffDetails {
  lineCount: number;
  key?: Key;
  clef?: Clef;
  tuning?: Note[];
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

export enum Step {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
}

export interface Note {
  step: Step;
  octave: number;
  duration: number;
  fret?: Fret;
}

export interface Fret {
  // TODO tab specific, make it a general note, with this being annotations
  fret: number;
  string: number;
}

export type Chord = Note | Note[];

export function* notes(chord: Chord) {
  if (isArray(chord)) {
    for (const note of chord) {
      yield note;
    }
  } else {
    yield chord;
  }
}
