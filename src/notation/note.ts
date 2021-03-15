import { isArray } from "lodash";
import { Pitch } from "./pitch";

export interface Note {
  duration: number;
  pitch?: Pitch;
  placement?: Placement;
  tie?: "start" | "stop";
}

export interface Placement {
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
