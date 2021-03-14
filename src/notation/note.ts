import { isArray } from "lodash";

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
  placement?: Placement;
  tie?: "start" | "stop";
}

export interface Placement {
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
