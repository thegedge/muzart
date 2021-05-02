import { clone } from "lodash";
import * as notation from "../../notation";
import { DEFAULT_MARGINS, DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH, LINE_MARGIN, STAFF_LINE_HEIGHT } from "./constants";
import { Line } from "./elements/Line";
import { Measure, Measure as MeasureLayout } from "./elements/Measure";
import { LineElementFlexGroup } from "./layouts/FlexGroup";
import { Page, Part, Score, Text } from "./types";
import Box from "./utils/Box";

/**
 * Return a layout for the given score.
 *
 * The score is laid out in inches, currently assuming a 8.5" x 11" page. Each page is laid out as
 * a series of lines that will be stacked vertically. For example, the first page will often be
 * some lines of text describing the composition (name, artist, etc) followed by many staff lines.
 */
export function layout(score: notation.Score): Score {
  return {
    score,
    parts: score.parts.map((part) => layOutPart(score, part)),
  };
}

// TODO decompose this more, move into other files (e.g., `Line.fromMeasures`)

function layOutPart(score: notation.Score, part: notation.Part): Part {
  const measures = part.measures;

  const margins = DEFAULT_MARGINS;
  const contentWidth = DEFAULT_PAGE_WIDTH - margins.left - margins.right;
  const contentHeight = DEFAULT_PAGE_HEIGHT - margins.top - margins.bottom;
  const pageContentBox = new Box(margins.left, margins.top, contentWidth, contentHeight);

  let pageGroup = new LineElementFlexGroup({ box: clone(pageContentBox), axis: "vertical" });

  // Lay out the composition title, composer, etc
  if (score.title) {
    const height = 4 * STAFF_LINE_HEIGHT;
    pageGroup.addElement(
      {
        type: "Text",
        box: new Box(0, 0, contentWidth, height),
        align: "center",
        size: height,
        value: score.title,
        style: {
          fontFamily: "serif",
        },
      },
      { factor: 0 }
    );
  }

  if (score.composer) {
    const height = 1.5 * STAFF_LINE_HEIGHT;

    pageGroup.addElement(
      {
        type: "Text",
        box: new Box(0, 0, contentWidth, 2 * height),
        align: "right",
        size: height,
        value: score.composer,
        style: {
          fontFamily: "serif",
        },
      },
      { factor: 0 }
    );
  }

  if (part.instrument && part.instrument.tuning) {
    // TODO show alternative name for tuning
    const textSize = STAFF_LINE_HEIGHT;
    const stringNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦"].slice(0, part.lineCount).reverse();
    const texts: Text[] = part.instrument.tuning.map((pitch, index) => ({
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

      pageGroup.addElement(
        {
          type: "Group",
          box: new Box(0, 0, textSize * 10, 1.3 * textSize),
          elements,
        },
        { factor: 0 }
      );
    }
  }

  if (pageGroup.elements.length > 0) {
    pageGroup.addElement(
      {
        type: "Space",
        box: new Box(0, 0, LINE_MARGIN, LINE_MARGIN),
      },
      { factor: 0 }
    );
  }

  const pages: Page[] = [];
  let line = new Line(new Box(0, 0, contentWidth, 0));

  // TODO: Ideally, the bottom of the last line lines up with the bottom of the content box of the page. We should iterate
  //       over the lines and scale the space between them so that that happens. Basically, a flex + flex-col layout.

  for (const measureToLayOut of measures) {
    const measure: Measure = new MeasureLayout(part, measureToLayOut);

    // Determine if we need to be on a new line.
    //
    // When "committing" the current line, it may be too large to fit on the current page, in which case we'll also
    // start a new page.

    if (line.tryAddElement(measure, { factor: measureToLayOut.chords.length })) {
      line.addBarLine();
    } else {
      line.layout();

      if (!pageGroup.tryAddElement(line)) {
        // TODO popping sucks, better = nested vertical group with "space between" option
        pageGroup.popElement(); // Pop off the last space element so that the last line's bottom coincides with content bottom
        pageGroup.layout();

        pages.push({
          elements: pageGroup.elements,
          width: DEFAULT_PAGE_WIDTH,
          height: DEFAULT_PAGE_HEIGHT,
          margins: clone(margins),
        });

        pageGroup = new LineElementFlexGroup({ box: clone(pageContentBox), axis: "vertical" });
        pageGroup.addElement(line);
      }

      pageGroup.addElement({
        type: "Space",
        box: new Box(0, 0, LINE_MARGIN, LINE_MARGIN),
      });

      line = new Line(new Box(0, 0, contentWidth, 0));
      line.addElement(measure, { factor: measureToLayOut.chords.length });
      line.addBarLine();
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
    pages.push({
      elements: pageGroup.elements,
      width: DEFAULT_PAGE_WIDTH,
      height: DEFAULT_PAGE_HEIGHT,
      margins: clone(margins),
    });
  }

  return { part, pages };
}
