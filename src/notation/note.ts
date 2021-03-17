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
