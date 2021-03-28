import { pick, pickBy } from "lodash";
import { NoteValue } from "./note_value";
import { Pitch } from "./pitch";

export type TieType = "start" | "stop";

export interface NoteOptions {
  placement: Placement;
  deadNote: boolean;
  tie: TieType;
  ghost: boolean;
}

export class Note {
  readonly placement?: Placement;
  readonly tie?: TieType;
  readonly deadNote?: boolean;
  readonly ghost?: boolean;

  constructor(readonly pitch: Pitch, readonly value: NoteValue, options?: Partial<NoteOptions>) {
    // The `pickBy` call here will filter out keys that have null/undefined values
    options && Object.assign(this, pickBy(pick(options, "placement", "deadNote", "tie", "ghost")));
  }

  toString() {
    let text;
    if (this.deadNote) {
      text = "x";
    } else if (this.tie === "stop") {
      text = ".";
    } else if (this.placement) {
      text = this.placement.fret.toString();
    } else {
      return "";
    }

    if (this.ghost) {
      text = `(${text})`;
    }

    return text;
  }
}

export interface Placement {
  fret: number;
  string: number;
}
