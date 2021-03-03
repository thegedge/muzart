export interface Score {
  title?: string;
  composer?: string;
  parts: Part[];
}

export interface Part {
  name?: string;
  measures: Measure[];
}

export interface Measure {
  chords: Chord[];
}

export type Chord = Note | Note[];

export interface Note {
  // TODO tab specific, make it a general note, with this being annotations
  fret: number;
  string: number;
}
