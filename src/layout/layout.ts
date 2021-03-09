import { clone } from "lodash";
import * as notation from "../notation";
import Box from "./Box";
import { HorizontalFlexGroup, VerticalFlexGroup } from "./Group";
import { Chord, Inches, LineElement, Margins, Measure, Score } from "./types";

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
  const part = input.parts[0];
  const measures = part.measures;

  const margins = DEFAULT_MARGINS;
  const contentWidth = DEFAULT_PAGE_WIDTH - 2 * margins.right;
  const contentHeight = DEFAULT_PAGE_HEIGHT - 2 * margins.bottom;
  const pageContentBox = new Box(margins.left, margins.top, contentWidth, contentHeight);

  let pageGroup = new VerticalFlexGroup<LineElement>(clone(pageContentBox));

  // For each measure, if we can fit it on the current line, we do so.
  // If the line will exceed the page height, we break into a new page.
  //
  // TODO: some heuristics to improve the process. Two ideas:
  //    1. If there's enough room on the line, but the measure would be too large for the page, perhaps it's
  //       better to start a new line?
  //    2. Even though we have a desired width for note durations, allow them to be stretched if it produces
  //       a nicer line.

  // Lay out the composition title, composer, etc
  if (input.title) {
    const height = 4 * STAFF_LINE_HEIGHT;
    pageGroup.addElement({
      type: "Text",
      box: new Box(0, 0, contentWidth, height),
      align: "center",
      size: height,
      value: input.title,
      style: {
        fontFamily: "serif",
      },
    });
  }

  if (input.composer) {
    const height = 1.5 * STAFF_LINE_HEIGHT;

    pageGroup.addElement({
      type: "Text",
      box: new Box(0, 0, contentWidth, height),
      align: "right",
      size: height,
      value: input.composer,
      style: {
        fontFamily: "serif",
      },
    });
  }

  if (measures[0].staveDetails && measures[0].staveDetails[0]?.tuning) {
    // TODO show the actual tuning, but okay using a name if it matches the tuning value
    const height = 1.2 * STAFF_LINE_HEIGHT;

    pageGroup.addElement({
      type: "Text",
      box: new Box(height, 0, contentWidth - height, height),
      align: "left",
      size: height,
      value: "Standard tuning",
      style: {
        fontFamily: "serif",
      },
    });
  }

  if (measures[0].staveDetails && measures[0].staveDetails[0]?.tempo) {
    const height = 1.2 * STAFF_LINE_HEIGHT;

    pageGroup.addElement({
      type: "Text",
      box: new Box(2 * height, 10, contentWidth - height, 2 * height),
      align: "left",
      size: height,
      value: `♩ = ${measures[0].staveDetails[0].tempo}`,
      style: {
        fontFamily: "serif",
        fontWeight: 800,
      },
    });
  }

  if (pageGroup.elements.length > 0) {
    pageGroup.addElement({
      type: "Space",
      box: new Box(0, 0, LINE_MARGIN, LINE_MARGIN),
    });
  }

  let line = newLine(contentWidth);

  // TODO: Ideally, the bottom of the last line lines up with the bottom of the content box of the page. We should iterate
  //       over the lines and scale the space between them so that that happens. Basically, a flex + flex-col layout.

  for (const measureToLayOut of measures) {
    const measure = layOutMeasure(measureToLayOut);
    line.box.height = Math.max(line.box.height, measure.box.height);

    // Determine if we need to be on a new line.
    //
    // When "committing" the current line, it may be too large to fit on the current page, in which case we'll also
    // start a new page.

    if (line.tryAddElement(measure)) {
      line.addElement({
        type: "BarLine",
        box: new Box(0, 0.5 * STAFF_LINE_HEIGHT, 0, 5 * STAFF_LINE_HEIGHT),
        strokeSize: LINE_STROKE_WIDTH,
      });
    } else {
      line.layout();

      if (pageGroup.tryAddElement(line)) {
        pageGroup.addElement({
          type: "Space",
          box: new Box(0, 0, LINE_MARGIN, LINE_MARGIN),
        });
      } else {
        // TODO popping sucks, better = nested vertical group with "space between" option
        pageGroup.elements.pop(); // Pop off the last space element so that the last line's bottom coincides with content bottom
        pageGroup.layout();

        score.pages.push({
          elements: pageGroup.elements,
          width: DEFAULT_PAGE_WIDTH,
          height: DEFAULT_PAGE_HEIGHT,
          margins: clone(margins),
        });

        pageGroup = new VerticalFlexGroup(clone(pageContentBox));
      }

      line = newLine(contentWidth);
      line.addElement(measure);
      line.addElement({
        type: "BarLine",
        box: new Box(0, 0.5 * STAFF_LINE_HEIGHT, 0, 5 * STAFF_LINE_HEIGHT),
        strokeSize: LINE_STROKE_WIDTH,
      });
    }
  }

  if (line.elements.length > 0) {
    line.layout();
    pageGroup.elements.push(line);
  } else {
    pageGroup.elements.pop();
  }

  if (pageGroup.elements.length > 0) {
    pageGroup.layout();
    score.pages.push({
      elements: pageGroup.elements,
      width: DEFAULT_PAGE_WIDTH,
      height: DEFAULT_PAGE_HEIGHT,
      margins: clone(margins),
    });
  }

  return score;
}

function layOutMeasure(measure: notation.Measure): Measure {
  const numStaffLines = 6;
  if (measure.staveDetails) {
    // TODO get staff details from previous measure, if one not given, so we can get lines
  }

  let width = QUARTER_NOTE_WIDTH / 8;
  const height = numStaffLines * STAFF_LINE_HEIGHT;

  const chords: Chord[] = [];
  for (const chord of measure.chords) {
    const chordLayout: Chord = {
      box: new Box(
        width,
        0,
        0,
        // TODO for regular score, needs to be computed from actual notes
        STAFF_LINE_HEIGHT * numStaffLines
      ),
      chord,
      notes: [],
    };

    for (const note of notation.notes(chord)) {
      // TODO need to pass around divisions attribute instead of hardcoded 960
      const noteWidth = Math.max(MIN_NOTE_WIDTH, (QUARTER_NOTE_WIDTH * note.duration) / 960);

      chordLayout.box.width = Math.max(chordLayout.box.width, noteWidth);
      chordLayout.notes.push({
        box: new Box(0, note.fret ? (note.fret.string - 1) * STAFF_LINE_HEIGHT : 0, noteWidth, STAFF_LINE_HEIGHT),
        note,
      });
    }

    width += chordLayout.box.width;
    chords.push(chordLayout);
  }

  return {
    type: "Measure",
    box: new Box(0, 0, width, height),
    chords,
    measure,
  };
}

function newLine(contentWidth: number) {
  const tabTextSize = (STAFF_LINE_HEIGHT * 4.5) / 3;
  const line = new HorizontalFlexGroup<LineElement>(new Box(0, 0, contentWidth, 0), true);

  addBarLine(line);

  line.addElement({
    type: "Group",
    box: new Box(0, STAFF_LINE_HEIGHT, tabTextSize, STAFF_LINE_HEIGHT * 5),
    elements: [
      {
        type: "Text",
        box: new Box(0, 0, tabTextSize, tabTextSize),
        align: "center",
        size: tabTextSize,
        value: "T",
      },
      {
        type: "Text",
        box: new Box(0, 1 * tabTextSize, tabTextSize, tabTextSize),
        align: "center",
        size: tabTextSize,
        value: "A",
      },
      {
        type: "Text",
        box: new Box(0, 2 * tabTextSize, tabTextSize, tabTextSize),
        align: "center",
        size: tabTextSize,
        value: "B",
      },
    ],
  });
  return line;
}

function addBarLine(group: HorizontalFlexGroup<LineElement>) {
  group.addElement({
    type: "BarLine",
    box: new Box(0, 0.5 * STAFF_LINE_HEIGHT, 0, 5 * STAFF_LINE_HEIGHT),
    strokeSize: LINE_STROKE_WIDTH,
  });
}
