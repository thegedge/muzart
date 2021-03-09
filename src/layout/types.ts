import { CSSProperties } from "react";
import * as notation from "../notation";
import Box from "./Box";

export type Inches = number;

export type Positioned = {
  x: Inches;
  y: Inches;
};

export type Sized = {
  width: Inches;
  height: Inches;
};

export type Boxed = Positioned &
  Sized & {
    right: Inches;
    bottom: Inches;
  };

export type HasBox = {
  box: Boxed;
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

export interface Page extends Sized {
  elements: LineElement[];
  margins: Margins;
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
  chords: Chord[];
  // TODO decorations, like time signatures, clefs, etc
  box: Box;
}

export interface Chord {
  chord: notation.Chord;
  notes: Note[];
  box: Box;
}

export interface Note {
  note: notation.Note;
  box: Box;
}

export type Alignment = "left" | "center" | "right";
