import { pickBy } from "lodash";
import { Duration } from "./duration";
import { Pitch } from "./pitch";

export type TieType = "start" | "stop";
export interface NoteOptions {
  placement: Placement;
  tie: TieType;
}

export class Note {
  readonly placement?: Placement;
  readonly tie?: TieType;

  constructor(readonly pitch: Pitch, readonly duration: Duration, options?: Partial<NoteOptions>) {
    // The `pickBy` call here will filter out keys that have null/undefined values
    options && Object.assign(this, pickBy(options));
  }
}

export interface Placement {
  fret: number;
  string: number;
}
