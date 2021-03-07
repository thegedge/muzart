import { clone, last } from "lodash";
import { Box, Inches, Margins, Sized } from ".";
import * as notation from "../notation";

export interface Score {
  score: notation.Score;
  pages: Page[];
}

export interface Page extends Sized {
  lines: Line[];
  margins: Margins;
}

export interface Line extends Box {
  elements: LineElement[];
}

export type LineElement = Text | Measure | BarLine;

export interface BarLine extends Box {
  type: "BarLine";
  strokeSize: number;
}
export interface Text extends Box {
  type: "Text";
  value: string;
  size: Inches;
  align: Alignment;
}

export interface Measure extends Box {
  type: "Measure";
  measure: notation.Measure;
  chords: Chord[];
  // TODO decorations, like time signatures, clefs, etc
}

export interface Chord extends Box {
  chord: notation.Chord;
  notes: Note[];
}

export interface Note extends Box {
  note: notation.Note;
}

export type Alignment = "left" | "center" | "right" | "justify";

const DEFAULT_PAGE_WIDTH: Inches = 8.5;
const DEFAULT_PAGE_HEIGHT: Inches = 11;
const DEFAULT_MARGIN: Inches = 0.5;
const DEFAULT_MARGINS: Margins = {
  left: DEFAULT_MARGIN,
  right: DEFAULT_MARGIN,
  top: DEFAULT_MARGIN,
  bottom: DEFAULT_MARGIN,
};

const MIN_NOTE_WIDTH = 0.2;
const QUARTER_NOTE_WIDTH: Inches = 0.5;
const LINE_MARGIN: Inches = 0.2;

/** The stroke width for any lines */
export const LINE_STROKE_WIDTH = 0.005;

/** The height of a single line in a staff (for example, a string for a guitar tablature staff) */
export const STAFF_LINE_HEIGHT: Inches = 0.1;

/**
 * Return a layout for the given score.
 *
 * The score is laid out in inches, currently assuming a 8.5" x 11" page. Each page is laid out as
 * a series of lines that will be stacked vertically. For example, the first page will often be
 * some lines of text describing the composition (name, artist, etc) followed by many staff lines.
 */
export function layout(input: notation.Score) {
  const score: Score = {
    score: input,
    pages: [],
  };

  // TODO specify part
  const measures = input.parts[0].measures;

  let page: Page = {
    lines: [],
    margins: clone(DEFAULT_MARGINS),
    width: DEFAULT_PAGE_WIDTH,
    height: DEFAULT_PAGE_HEIGHT,
  };

  // For each measure, if we can fit it on the current line, we do so.
  // If the line will exceed the page height, we break into a new page.
  //
  // TODO: some heuristics to improve the process. Two ideas:
  //    1. If there's enough room on the line, but the measure would be too large for the page, perhaps it's
  //       better to start a new line?
  //    2. Even though we have a desired width for note durations, allow them to be stretched if it produces
  //       a nicer line.

  const contentWidth = page.width - page.margins.left - page.margins.right;
  const contentHeight = page.height - page.margins.top - page.margins.bottom;

  let line: Line = { elements: [], x: 0, y: 0, width: contentWidth, height: 0 };

  let width = 0;
  let height = 0;
  let remainingLineWidth = contentWidth;
  let remainingPageHeight = contentHeight;

  for (const measureToLayOut of measures) {
    const measure = layoutMeasure(measureToLayOut);
    measure.x = width;

    line.height = Math.max(line.height, measure.height);

    // Determine if we need to be on a new line.
    //
    // When "committing" the current line, it may be too large to fit on the current page, in which case we'll also
    // start a new page.

    if (measure.width > remainingLineWidth) {
      if (line.height > remainingPageHeight) {
        score.pages.push(page);

        height = line.height;
        remainingPageHeight = contentHeight - line.height;
        page = {
          lines: [relayoutLine(line, contentWidth)],
          margins: clone(DEFAULT_MARGINS),
          width: DEFAULT_PAGE_WIDTH,
          height: DEFAULT_PAGE_HEIGHT,
        };
      } else {
        line.y = height;
        remainingPageHeight -= line.height + LINE_MARGIN;
        height += line.height + LINE_MARGIN;
        page.lines.push(relayoutLine(line, contentWidth));
      }

      line = { elements: [], x: 0, y: 0, width: contentWidth, height: 0 };
      remainingLineWidth = contentWidth;
      width = 0;
    } else {
      width += measure.width;
      remainingLineWidth -= measure.width;
      line.elements.push(measure);
    }
  }

  if (line.elements.length > 0) {
    line.y = height;
    page.lines.push(relayoutLine(line, contentWidth));
  }

  if (page.lines.length > 0) {
    score.pages.push(page);
  }

  // For every line, put a bar line in between each measure.
  // TODO ideally just make this part of the above loop
  for (const page of score.pages) {
    for (const line of page.lines) {
      let first = true;
      line.elements = line.elements.flatMap((element): LineElement | LineElement[] => {
        if (element.type != "Measure") {
          return element;
        }

        const barLineRight: BarLine = {
          type: "BarLine",
          x: element.x + element.width,
          y: 0.5 * STAFF_LINE_HEIGHT,
          width: 0,
          height: element.height - STAFF_LINE_HEIGHT,
          strokeSize: LINE_STROKE_WIDTH,
        };

        if (first) {
          first = false;
          return [
            {
              type: "BarLine",
              x: 0,
              y: 0.5 * STAFF_LINE_HEIGHT,
              width: 0,
              height: element.height - STAFF_LINE_HEIGHT,
              strokeSize: LINE_STROKE_WIDTH,
            } as BarLine,
            element,
            barLineRight,
          ];
        } else {
          return [element, barLineRight];
        }
      });
    }
  }

  return score;
}

/** Take an existing staff line and reposition all elements horizontally so that they fill the line. */
function relayoutLine(line: Line, desiredWidth: number) {
  const lastElement = last(line.elements);
  if (!lastElement) {
    return line;
  }

  let stretchFactor = 1;
  switch (lastElement.type) {
    case "BarLine":
      stretchFactor = desiredWidth / (lastElement.x + lastElement.strokeSize);
      break;
    default:
      stretchFactor = desiredWidth / (lastElement.x + lastElement.width);
      break;
  }

  let x = 0;
  for (const element of line.elements) {
    element.x = x;
    element.width *= stretchFactor;
    x += element.width;
  }

  line.width = desiredWidth;
  return line;
}

function layoutMeasure(measure: notation.Measure): Measure {
  const numStaffLines = 6;
  if (measure.staveDetails) {
    // TODO get staff details from previous measure, if one not given, so we can get lines
  }

  let width = QUARTER_NOTE_WIDTH / 8;
  const height = numStaffLines * STAFF_LINE_HEIGHT;

  const chords: Chord[] = [];
  for (const chord of measure.chords) {
    const chordLayout: Chord = {
      x: width,
      y: 0,
      width: 0,
      // TODO for regular score, needs to be computed from actual notes
      height: STAFF_LINE_HEIGHT * numStaffLines,
      chord,
      notes: [],
    };

    for (const note of notation.notes(chord)) {
      // TODO need to pass around divisions attribute instead of hardcoded 960
      const noteWidth = Math.max(MIN_NOTE_WIDTH, (QUARTER_NOTE_WIDTH * note.duration) / 960);

      chordLayout.width = Math.max(chordLayout.width, noteWidth);
      chordLayout.notes.push({
        x: 0,
        y: note.fret ? (note.fret.string - 1) * STAFF_LINE_HEIGHT : 0,
        width: noteWidth,
        height: STAFF_LINE_HEIGHT,
        note,
      });
    }

    width += chordLayout.width;
    chords.push(chordLayout);
  }

  return {
    type: "Measure",
    x: 0,
    y: 0,
    width,
    height,
    chords,
    measure,
  };
}
