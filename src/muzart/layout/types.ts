import { CSSProperties } from "react";
import * as notation from "../../notation";
import { Box } from "./utils/Box";

export type Inches = number;
export type Alignment = "start" | "middle" | "end";
export type VerticalOrientation = "above" | "below";

export interface HasBox {
  box: Box;
}

export interface HasParent<ParentT = unknown> {
  parent?: LayoutElement<ParentT>;
}

export interface LayoutElement<ParentT = unknown> extends HasBox, HasParent<ParentT> {
  type: string;
}

export interface Margins {
  left: Inches;
  right: Inches;
  top: Inches;
  bottom: Inches;
}

export interface Score extends LayoutElement<never> {
  type: "Score";
  score: notation.Score;
  parts: Part[];
}

export interface Part extends LayoutElement<Score> {
  type: "Part";
  part: notation.Part;
  pages: Page[];
}

export type PageElement = Group<PageElement> | Space | Text | Group<LineElement> | PageLine;

export interface Page extends LayoutElement<Part> {
  type: "Page";
  content: Group<PageElement>;
  measures: Measure[];
}

export interface PageLine extends LayoutElement<Page> {
  type: "PageLine";
  elements: LineElement[];
  measures: Measure[];
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
  | Group<LineElement>
  | Line
  | Measure
  | Rest
  | Slide
  | Space
  | Stem
  | Text
  | Vibrato
  | Wrapped<LineElement>;

export interface Wrapped<T extends LayoutElement<unknown>> extends LayoutElement<unknown> {
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

export interface Group<T> extends LayoutElement<unknown> {
  type: "Group";
  elements: T[];
}

export interface ChordDiagram extends LayoutElement<LineElement> {
  type: "ChordDiagram";
  diagram: notation.ChordDiagram;
}

export interface Line extends LayoutElement<PageLine> {
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
  chords: (Chord | Rest)[];
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

/**
 * Find the ancestor element of a given type.
 *
 * @returns The element whose `type` matches the given `type`. If `e` itself is of the given type, `e` will be returned.
 */
export function getAncestorOfType<T extends LayoutElement<unknown>>(
  e: LayoutElement<unknown> | undefined,
  type: string
): T | undefined {
  while (e) {
    if (e.type == type) {
      return e as T;
    }
    e = e.parent;
  }
  return e;
}
