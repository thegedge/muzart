import { CSSProperties } from "react";
import * as notation from "../../notation";
import Box from "./utils/Box";

export type Inches = number;
export type Alignment = "start" | "middle" | "end";
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

export type PageElement = Space | Text | Group;

export interface Page {
  elements: PageElement[];
  margins: Margins;
  width: Inches;
  height: Inches;
}

export type LineElement =
  | Arc
  | BarLine
  | Beam
  | Bend
  | DashedLineText
  | Dot
  | Group
  | Line
  | Measure
  | Space
  | Stem
  | Text
  | Vibrato
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

export interface Bend {
  type: "Bend";
  box: Box;
  bend: notation.Bend;

  /**
   * How far below the box's bottom edge the bend should go to reach the note.
   *
   * This is only necessary if this element is not sized to reach the bend note, which is the case right now
   * because we make it part of the `GridGroup` used for above staff things.
   */
  descent: number;
}

export interface Group {
  type: "Group";
  elements: LineElement[];
  box: Box;
}

export interface Line {
  type: "Line";
  box: Box;
  color: string;
}

export interface Space {
  type: "Space";
  box: Box;
}

export interface Vibrato {
  type: "Vibrato";
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
  halign?: Alignment;
  valign?: Alignment;
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
