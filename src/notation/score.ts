import { Instrument } from "./instrument";
import { Measure } from "./measure";

export interface Score {
  title?: string;
  composer?: string;
  comments?: string[];
  parts: Part[];
}

export interface Part {
  name?: string;
  instrument?: Instrument;
  lineCount: number;
  measures: Measure[];
}
