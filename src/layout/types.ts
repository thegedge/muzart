import { CSSProperties } from "react";
import * as notation from "../notation";
import Box from "./Box";

export type Inches = number;

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
  pages: Page[];
}

export interface Page {
  elements: LineElement[];
  margins: Margins;
  width: Inches;
  height: Inches;
}

export type LineElement = Space | Text | Measure | BarLine | Group;

export interface Group {
  type: "Group";
  elements: LineElement[];
  box: Box;
  drawStaffLines?: boolean; // TODO :( find a better way
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
  align: Alignment;
  box: Box;
  style?: CSSProperties;
}

export interface Measure {
  type: "Measure";
  measure: notation.Measure;
  box: Box;
  elements: (Chord | Space)[];
  // TODO decorations, like time signatures, clefs, etc
}

export interface Chord {
  type: "Chord";
  chord: notation.Chord;
  notes: Note[];
  box: Box;
}

export interface Note {
  type: "Note";
  note: notation.Note;
  box: Box;
}

export type Alignment = "left" | "center" | "right";
