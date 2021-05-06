import { CSSProperties } from "react";
import * as notation from "../../notation";
import Box from "./utils/Box";

export type Inches = number;
export type Alignment = "left" | "center" | "right";
export type VerticalOrientation = "above" | "below";

export type HasBox = {
  box: Box;
};

export type Margins = {
  left: Inches;
  right: Inches;
  top: Inches;
  bottom: Inches;
};

export interface Score {
  score: notation.Score;
  parts: Part[];
}

export interface Part {
  part: notation.Part;
  pages: Page[];
}

export interface Page {
  elements: LineElement[];
  margins: Margins;
  width: Inches;
  height: Inches;
}

export type LineElement =
  | Arc
  | BarLine
  | Beam
  | DashedLineText
  | Dot
  | Group
  | Measure
  | Space
  | Stem
  | Text
  | Wrapped<LineElement>;

export interface Wrapped<T extends HasBox> {
  type: "Wrapped";
  element: T;
  box: Box;
}

export interface Arc {
  type: "Arc";
  box: Box;
  orientation: VerticalOrientation;
}

export interface Group {
  type: "Group";
  elements: LineElement[];
  box: Box;

  // TODO make line a special thing, so that we don't need this here
  numStaffLines?: number;
}

export interface Space {
  type: "Space";
  box: Box;
}

export interface BarLine {
  type: "BarLine";
  strokeSize: number;
  box: Box;
}

export interface Text {
  type: "Text";
  value: string;
  size: Inches;
  align?: Alignment;
  box: Box;
  style?: CSSProperties;
}

export interface DashedLineText {
  type: "DashedLineText";
  value: string;
  size: Inches;
  box: Box;
}

export interface Measure {
  type: "Measure";
  measure: notation.Measure;
  box: Box;
  elements: (Chord | Rest | Space)[];
  // TODO decorations, like time signatures, clefs, etc
}

export interface Chord {
  type: "Chord";
  chord: notation.Chord;
  notes: Note[];
  box: Box;
}

export interface Rest {
  type: "Rest";
  chord: notation.Chord;
  box: Box;
}

export interface Note {
  type: "Note";
  note: notation.Note;
  box: Box;
}

export interface Stem {
  type: "Stem";
  box: Box;
}

export interface Beam {
  type: "Beam";
  box: Box;
}

export interface Dot {
  type: "Dot";
  box: Box;
}

export interface Tuplet {
  type: "Tuplet";
  box: Box;
  orientation: VerticalOrientation;
}
