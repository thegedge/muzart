import { Pitch } from "./pitch";

export interface Instrument {
  midiPreset: number;
  tuning?: Pitch[];
}
