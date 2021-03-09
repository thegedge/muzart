import { Measure } from ".";

export interface Score {
  title?: string;
  composer?: string;
  parts: Part[];
}

export interface Part {
  name?: string;
  measures: Measure[];
}
