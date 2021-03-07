import { CSSProperties } from "react";
import * as notation from "../notation";
import Box from "./Box";

export type Inches = number;

export interface Positioned {
  x: Inches;
  y: Inches;
}

export interface Sized {
  width: Inches;
  height: Inches;
}

export type Boxed = Positioned & Sized;

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
  lines: Line[];
  margins: Margins;
}

export interface Group {
  type: "Group";
  elements: LineElement[];
  box: Box;
}

export interface Line {
  elements: LineElement[];
  box: Box;
}

export type LineElement = Text | Measure | BarLine | Group;

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
