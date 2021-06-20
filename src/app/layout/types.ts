import { CSSProperties } from "react";
import * as notation from "../../notation";
import Box from "./utils/Box";

export type Inches = number;
export type Alignment = "start" | "middle" | "end";
export type VerticalOrientation = "above" | "below";

export interface HasBox {
  box: Box;
}

export interface HasParent<T = any> {
  parent?: T;
}

export interface LayoutElement<T = any> extends HasBox, HasParent<T> {
  type: string;
}

export interface Margins {
  left: Inches;
  right: Inches;
  top: Inches;
  bottom: Inches;
}

export interface Score {
  type: "Score";
  score: notation.Score;
  parts: Part[];
}

export interface Part extends HasParent<Score> {
  type: "Part";
  part: notation.Part;
  pages: Page[];
}

export type PageElement = Space | Text | Group;

export interface Page extends LayoutElement<Part> {
  type: "Page";
  elements: PageElement[];
  margins: Margins;
}

export type LineElement =
  | Arc
  | BarLine
  | Beam
  | Bend
  | Chord
  | ChordDiagram
  | DashedLineText
  | Dot
  | Group
  | Line
  | Measure
  | Rest
  | Slide
  | Space
  | Stem
  | Text
  | Vibrato
  | Wrapped<LineElement>;

export interface Wrapped<T extends LayoutElement<any>> extends LayoutElement<any> {
  type: "Wrapped";
  element: T;
}

export interface Arc extends LayoutElement<LineElement> {
  type: "Arc";
  orientation: VerticalOrientation;
}

export interface Bend extends LayoutElement<LineElement> {
  type: "Bend";
  bend: notation.Bend;

  /**
   * How far below the box's bottom edge the bend should go to reach the note.
   *
   * This is only necessary if this element is not sized to reach the bend note, which is the case right now
   * because we make it part of the `GridGroup` used for above staff things.
   */
  descent: number;
}

export interface Group extends LayoutElement<any> {
  type: "Group";
  elements: LineElement[];
}

export interface ChordDiagram extends LayoutElement<LineElement> {
  type: "ChordDiagram";
  diagram: notation.ChordDiagram;
}

export interface Line extends LayoutElement<LineElement> {
  type: "Line";
  color: string;
}

export interface Space extends LayoutElement<LineElement> {
  type: "Space";
}

export interface Vibrato extends LayoutElement<LineElement> {
  type: "Vibrato";
}

export interface BarLine extends LayoutElement<LineElement> {
  type: "BarLine";
  strokeSize: number;
}

export interface Text extends LayoutElement<LineElement> {
  type: "Text";
  value: string;
  size: Inches;
  halign?: Alignment;
  valign?: Alignment;
  style?: CSSProperties;
}

export interface DashedLineText extends LayoutElement<LineElement> {
  type: "DashedLineText";
  value: string;
  size: Inches;
}

export interface Measure extends LayoutElement<LineElement> {
  type: "Measure";
  measure: notation.Measure;
  box: Box;
  elements: LineElement[];
  // TODO decorations, like time signatures, clefs, etc
}

export interface Chord extends LayoutElement<LineElement> {
  type: "Chord";
  chord: notation.Chord;
  notes: Note[];
}

export interface Rest extends LayoutElement<LineElement> {
  type: "Rest";
  chord: notation.Chord;
}

export interface Note extends LayoutElement<LineElement> {
  type: "Note";
  note: notation.Note;
}

export interface Slide extends LayoutElement<LineElement> {
  type: "Slide";
  upwards: boolean;
}

export interface Stem extends LayoutElement<LineElement> {
  type: "Stem";
}

export interface Beam extends LayoutElement<LineElement> {
  type: "Beam";
}

export interface Dot extends LayoutElement<LineElement> {
  type: "Dot";
}

export interface Tuplet extends LayoutElement<LineElement> {
  type: "Tuplet";
  orientation: VerticalOrientation;
}

export function getParentOfType<T extends LayoutElement<any>>(
  e: LayoutElement<any> | undefined,
  type: string
): T | undefined {
  e = e?.parent;
  while (e) {
    if (e.type == type) {
      return e as T;
    }
    e = e.parent;
  }
  return e;
}
