import * as CSS from "csstype";
import * as notation from "../notation";
import { Box } from "./utils/Box";

export type Millimetres = number;
export type Alignment = "start" | "center" | "end";
export type VerticalOrientation = "above" | "below";

/**
 * Context propagated throughout the layout process.
 */
export type LayoutContext = {
  /**
   * Mode to use by layout algorithms
   *
   * `normal` is the default layout style, rendering the score as pages with gap.
   * `compact` tries to minimize the margins and paddings, which is good for small screens.
   */
  layoutMode: "compact" | "normal";
};

export interface HasBox {
  box: Box;
}

export interface MaybeLayout<Args extends unknown[] = []> {
  layout?: (...args: Args) => void;
}

export interface LayoutElement<ParentT extends AnyLayoutElement | null, LayoutArgs extends never[] = never[]>
  extends HasBox,
    MaybeLayout<LayoutArgs> {
  type: string;
  parent: ParentT | null;
  style?: CSS.Properties;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyLayoutElement = LayoutElement<any>;

export interface Margins {
  left: Millimetres;
  right: Millimetres;
  top: Millimetres;
  bottom: Millimetres;
}

export type AllElements = Score | Part | Page | PageElement | LineElement;

export interface Score extends LayoutElement<null> {
  type: "Score";
  score: notation.Score;
  children: Part[];
}

export interface Part extends LayoutElement<Score> {
  type: "Part";
  part: notation.Part;
  children: Page[];
  measures: Measure[];
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
  | Ellipse
  | Group<LineElement>
  | Line
  | Measure
  | Note
  | Path
  | Stroke
  | Rest
  | Slide
  | Space
  | Text
  | TimeSignature
  | Vibrato;

// TODO eliminate LineElement as a parent below, and have it be PageLine instead (potentially unioned with others)
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

export interface Group<T> extends LayoutElement<AnyLayoutElement> {
  type: "Group";
  children: T[];
}

export interface ChordDiagram extends LayoutElement<LineElement> {
  type: "ChordDiagram";
  diagram: notation.ChordDiagram;
}

export interface Ellipse extends LayoutElement<ChordDiagram> {
  type: "Ellipse";
}

export interface Line extends LayoutElement<LineElement> {
  type: "Line";
}

export interface Path extends LayoutElement<PageLine | ChordDiagram> {
  type: "Path";
  path: Path2D;
}

export interface Space extends LayoutElement<LineElement | PageElement> {
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

export interface Text extends LayoutElement<AllElements> {
  type: "Text";
  text: string;

  // Font size / line height
  // TODO maybe have line height be different
  size: Millimetres;

  readonly lines: string[];
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
  decorations: {
    start?: TextDecoration;
    end?: TextDecoration;
  };
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
  notes: Note[];
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
