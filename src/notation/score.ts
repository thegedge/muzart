import { Instrument } from "./instrument";
import { Measure } from "./measure";

export interface Score {
  title?: string;
  subTitle?: string;
  artist?: string;
  album?: string;
  composer?: string;
  copyright?: string;
  transcriber?: string;
  instructions?: string;
  comments?: string[];

  parts: Part[];
}

export interface Part {
  name: string;
  color?: string;
  instrument?: Instrument;
  lineCount: number;
  measures: Measure[];
}
