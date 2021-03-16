import { clone } from "lodash";
import * as notation from "../notation";
import Box from "./Box";
import { Group } from "./FlexGroup";
import { Measure, Measure as MeasureLayout } from "./Measure";
import { Inches, LineElement, Margins, Score, Text } from "./types";

const DEFAULT_PAGE_WIDTH: Inches = 8.5;
const DEFAULT_PAGE_HEIGHT: Inches = 11;
const DEFAULT_MARGIN: Inches = 0.5;
const DEFAULT_MARGINS: Margins = {
  left: DEFAULT_MARGIN,
  right: DEFAULT_MARGIN,
  top: DEFAULT_MARGIN,
  bottom: DEFAULT_MARGIN,
};

const LINE_MARGIN: Inches = 0.25;

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
  const part = input.parts[2];
  const measures = part.measures;

  const margins = DEFAULT_MARGINS;
  const contentWidth = DEFAULT_PAGE_WIDTH - margins.left - margins.right;
  const contentHeight = DEFAULT_PAGE_HEIGHT - margins.top - margins.bottom;
  const pageContentBox = new Box(margins.left, margins.top, contentWidth, contentHeight);

  let pageGroup = new Group<LineElement>({ box: clone(pageContentBox), axis: "vertical" });

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
      box: new Box(0, 0, contentWidth, 2 * height),
      align: "right",
      size: height,
      value: input.composer,
      style: {
        fontFamily: "serif",
      },
    });
  }

  if (measures[0].staveDetails && measures[0].staveDetails[0]?.tuning) {
    // TODO show alternative name for tuning
    const textSize = STAFF_LINE_HEIGHT;
    const details = measures[0].staveDetails[0];
    const stringNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦"].slice(0, details.lineCount).reverse();
    const texts: Text[] = measures[0].staveDetails[0].tuning.map((pitch, index) => ({
      type: "Text",
      box: new Box(0, 0, textSize * 5, textSize),
      align: "left",
      size: textSize,
      value: `${stringNumbers[index]} = ${pitch}`,
      style: {
        fontFamily: "serif",
      },
    }));

    const offset = Math.round(texts.length / 2);
    for (let index = 0; index < offset; ++index) {
      const elements = [texts[index]];
      if (offset + index < texts.length) {
        const text = texts[offset + index];
        text.box.x = textSize * 5;
        elements.push(text);
      }

      pageGroup.addElement({
        type: "Group",
        box: new Box(0, 0, textSize * 10, 1.3 * textSize),
        elements,
      });
    }
  }

  let divisions = 960;
  if (measures[0].staveDetails) {
    divisions = measures[0].staveDetails[0]?.divisions ?? 960;
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
    const measure: Measure = new MeasureLayout(measureToLayOut, divisions);
    line.box.height = Math.max(line.box.height, measure.box.height);

    // Determine if we need to be on a new line.
    //
    // When "committing" the current line, it may be too large to fit on the current page, in which case we'll also
    // start a new page.

    if (line.tryAddElement(measure, { factor: measure.elements.length })) {
      addBarLine(line);
    } else {
      line.layout();

      if (pageGroup.tryAddElement(line)) {
        pageGroup.addElement({
          type: "Space",
          box: new Box(0, 0, LINE_MARGIN, LINE_MARGIN),
        });
      } else {
        // TODO popping sucks, better = nested vertical group with "space between" option
        pageGroup.popElement(); // Pop off the last space element so that the last line's bottom coincides with content bottom
        pageGroup.layout();

        score.pages.push({
          elements: pageGroup.elements,
          width: DEFAULT_PAGE_WIDTH,
          height: DEFAULT_PAGE_HEIGHT,
          margins: clone(margins),
        });

        pageGroup = new Group({ box: clone(pageContentBox), axis: "vertical" });
      }

      line = newLine(contentWidth);
      line.addElement(measure, { factor: measure.elements.length });
      addBarLine(line);
    }
  }

  if (line.elements.length > 0) {
    line.layout();
    pageGroup.addElement(line);
  } else {
    pageGroup.popElement();
  }

  if (pageGroup.elements.length > 0) {
    pageGroup.layout(false);
    score.pages.push({
      elements: pageGroup.elements,
      width: DEFAULT_PAGE_WIDTH,
      height: DEFAULT_PAGE_HEIGHT,
      margins: clone(margins),
    });
  }

  return score;
}

function newLine(contentWidth: number) {
  const tabTextSize = (STAFF_LINE_HEIGHT * 4.5) / 3;
  const tabWidth = tabTextSize * 2;
  const line = new Group<LineElement>({ box: new Box(0, 0, contentWidth, 0), drawStaffLines: true });

  addBarLine(line);

  line.addElement(
    {
      type: "Group",
      box: new Box(0, 0.75 * STAFF_LINE_HEIGHT, tabWidth, STAFF_LINE_HEIGHT * 5),
      elements: [
        {
          type: "Text",
          box: new Box(0, 0, tabWidth, tabTextSize),
          align: "center",
          size: tabTextSize,
          value: "T",
        },
        {
          type: "Text",
          box: new Box(0, 1 * tabTextSize, tabWidth, tabTextSize),
          align: "center",
          size: tabTextSize,
          value: "A",
        },
        {
          type: "Text",
          box: new Box(0, 2 * tabTextSize, tabWidth, tabTextSize),
          align: "center",
          size: tabTextSize,
          value: "B",
        },
      ],
    },
    { factor: null }
  );
  return line;
}

function addBarLine(group: Group<LineElement>) {
  group.addElement(
    {
      type: "BarLine",
      box: new Box(0, 0.5 * STAFF_LINE_HEIGHT, LINE_STROKE_WIDTH, 5 * STAFF_LINE_HEIGHT),
      strokeSize: LINE_STROKE_WIDTH,
    },
    { factor: null }
  );
}
