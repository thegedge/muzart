import { CSSProperties } from "preact/compat";
import * as notation from "../notation";
import { Box } from "./utils/Box";

export type Millimetres = number;
export type Alignment = "start" | "center" | "end";
export type VerticalOrientation = "above" | "below";

export interface HasBox {
  box: Box;
}

export interface HasParent<ParentT = unknown> {
  parent: LayoutElement<ParentT> | null;
}

export interface MaybeLayout<Args extends unknown[] = []> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layout?: (...args: Args) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface LayoutElement<ParentT = unknown, LayoutArgs extends unknown[] = any[]>
  extends HasBox,
    HasParent<ParentT>,
    MaybeLayout<LayoutArgs> {
  type: string;
}

export interface Margins {
  left: Millimetres;
  right: Millimetres;
  top: Millimetres;
  bottom: Millimetres;
}

export type AllElements = Score | Part | Page | PageElement | LineElement;

export interface Score extends LayoutElement<never> {
  type: "Score";
  score: notation.Score;
  children: Part[];
}

export interface Part extends LayoutElement<Score> {
  type: "Part";
  part: notation.Part;
  children: Page[];
}

export type PageElement = Group<PageElement> | ChordDiagram | Space | Text | Group<LineElement> | PageLine;

export interface Page extends LayoutElement<Part> {
  type: "Page";
  content: Group<PageElement>;
  measures: Measure[];
}

export interface PageLine extends LayoutElement<Page> {
  type: "PageLine";
  children: LineElement[];
  measures: Measure[];
}

export type LineElement =
  | Arc
  | BarLine
  | Beam
  | Bend
  | Chord
  | ChordDiagram
  | DecoratedText
  | Dot
  | Group<LineElement>
  | Line
  | Measure
  | Note
  | Stroke
  | Rest
  | Slide
  | Space
  | Text
  | TimeSignature
  | Vibrato;

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
  children: T[];
}

export interface ChordDiagram extends LayoutElement<LineElement> {
  type: "ChordDiagram";
  diagram: notation.ChordDiagram;
  textSize: number;
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

export interface Stroke extends LayoutElement<LineElement> {
  type: "Stroke";
  stroke: notation.Stroke;
}

export interface Text extends LayoutElement<LineElement> {
  type: "Text";
  text: string;
  size: Millimetres;
  halign?: Alignment;
  valign?: Alignment;
  style?: CSSProperties;
  readonly isReadOnly?: boolean;
}

export interface TextDecoration {
  upTick?: boolean;
  downTick?: boolean;
  dashed?: boolean;
}

export interface DecoratedText extends LayoutElement<LineElement> {
  type: "DecoratedText";
  text: string;
  size: Millimetres;
  startDecoration?: TextDecoration;
  endDecoration?: TextDecoration;
}

export interface Measure extends LayoutElement<LineElement> {
  type: "Measure";
  measure: notation.Measure;
  box: Box;
  children: LineElement[];
  chords: (Chord | Rest)[];
}

export interface Chord extends LayoutElement<LineElement> {
  type: "Chord";
  chord: notation.Chord;
  children: (Note | Stroke)[];
  staffHeight: number;
}

export const isChord = (value: unknown): value is Chord => {
  return typeof value == "object" && value != null && "type" in value && value.type == "Chord";
};

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

export interface Beam extends LayoutElement<LineElement> {
  type: "Beam";
  size: number;
}

export interface Dot extends LayoutElement<LineElement> {
  type: "Dot";
}

export interface Tuplet extends LayoutElement<LineElement> {
  type: "Tuplet";
  orientation: VerticalOrientation;
}

export interface TimeSignature extends LayoutElement<LineElement> {
  type: "TimeSignature";
  timeSignature: notation.TimeSignature;
}

/**
 * Find the ancestor element of a given type.
 *
 * @returns The element whose `type` matches the given `type`. If `e` itself is of the given type, `e` will be returned.
 */
export const getAncestorOfType = <T extends LayoutElement<unknown>>(
  e: LayoutElement<unknown>,
  type: string,
): T | null => {
  let current: LayoutElement<unknown> | undefined | null = e;
  while (current) {
    if (current.type == type) {
      return current as T;
    }
    current = current.parent;
  }
  return current ?? null;
};
