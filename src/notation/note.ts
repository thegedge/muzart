import { Pitch } from "./pitch";

export type TieType = "start" | "stop";
export interface NoteOptions {
  placement: Placement;
  tie: TieType;
}
export class Note {
  readonly placement?: Placement;
  readonly tie?: TieType;

  constructor(readonly pitch: Pitch, readonly duration: number, options?: Partial<NoteOptions>) {
    options && Object.assign(this, options);
  }
}

export interface Placement {
  fret: number;
  string: number;
}
