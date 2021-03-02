export interface Score {
  title: string;
  parts: Part[];
}

export interface Part {
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
