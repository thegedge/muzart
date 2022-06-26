import { clone } from "lodash";
import * as notation from "../../notation";
import { DEFAULT_MARGINS, DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH, LINE_MARGIN, STAFF_LINE_HEIGHT } from "./constants";
import { Measure as MeasureLayout } from "./elements/Measure";
import { PageLine } from "./elements/PageLine";
import { FlexGroupElement } from "./layouts/FlexGroup";
import { SimpleGroup } from "./layouts/SimpleGroup";
import { LineElement, Margins, Measure, Page, PageElement, Part, Score, Text } from "./types";
import { Box } from "./utils/Box";

/**
 * Return a layout for the given score.
 *
 * The score is laid out in inches, currently assuming a 8.5" x 11" page. Each page is laid out as
 * a series of lines that will be stacked vertically. For example, the first page will often be
 * some lines of text describing the composition (name, artist, etc) followed by many staff lines.
 */
export function layout(score: notation.Score): Score {
  console.time("layout");
  try {
    return {
      type: "Score",
      score,
      parts: score.parts.map((part) => layOutPart(score, part)),
      box: new Box(0, 0, 0, 0), // TODO compute a box
    };
  } finally {
    console.timeEnd("layout");
  }
}

export const PAGE_MARGIN = 0.5;

// TODO decompose this more, move into other files (e.g., `Line.fromMeasures`)

function layOutPart(score: notation.Score, part: notation.Part): Part {
  const measures = part.measures;
  const margins = DEFAULT_MARGINS;
  const contentWidth = DEFAULT_PAGE_WIDTH - margins.left - margins.right;
  const contentHeight = DEFAULT_PAGE_HEIGHT - margins.top - margins.bottom;
  const pageContentBox = new Box(margins.left, margins.top, contentWidth, contentHeight);
  const pages: Page[] = [];

  let pageGroup = new FlexGroupElement<PageElement>({ box: clone(pageContentBox), axis: "vertical" });
  layOutPartHeader(pageGroup, score, part, contentWidth);

  let line = new PageLine(new Box(0, 0, contentWidth, 0), part.lineCount);
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

      // TODO "min space between" in flex group
      if (pageGroup.elements.length > 0) {
        pageGroup.addElement({
          type: "Space",
          box: new Box(0, 0, LINE_MARGIN, LINE_MARGIN),
        });
      }

      if (!pageGroup.tryAddElement(line, { factor: null })) {
        pageGroup = startNewPage(pages, margins, pageContentBox, pageGroup);
        pageGroup.addElement(line);
      }

      line = new PageLine(new Box(0, 0, contentWidth, 0), part.lineCount);
      line.addElement(measure, { factor: measureToLayOut.chords.length });
      line.addBarLine();
    }
  }

  // TODO a lot of code here is shared with the loop above

  if (line.elements.length > 0) {
    line.layout();

    pageGroup.addElement({
      type: "Space",
      box: new Box(0, 0, LINE_MARGIN, LINE_MARGIN),
    });

    if (!pageGroup.tryAddElement(line)) {
      pageGroup = startNewPage(pages, margins, pageContentBox, pageGroup);
      pageGroup.addElement(line);
    }
  }

  if (pageGroup.elements.length > 0) {
    pageGroup.layout(false);

    const page: Page = {
      type: "Page",
      elements: pageGroup.elements,
      box: new Box(0, pages.length * (DEFAULT_PAGE_HEIGHT + PAGE_MARGIN), DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT),
      margins: clone(margins),
      measures: measureElements(pageGroup.elements),
    };

    for (const element of pageGroup.elements) {
      element.parent = page;
    }
    pages.push(page);
  }

  const partLayout: Part = {
    type: "Part",
    part,
    pages,
    box: new Box(0, 0, 0, 0), // TODO compute a box
  };

  for (const page of pages) {
    page.parent = partLayout;
  }

  return partLayout;
}

function startNewPage(pages: Page[], margins: Margins, pageContentBox: Box, pageGroup: FlexGroupElement<PageElement>) {
  pageGroup.popElement(); // remove spacer we just added above
  pageGroup.layout();

  const page: Page = {
    type: "Page",
    elements: pageGroup.elements,
    box: new Box(0, pages.length * (DEFAULT_PAGE_HEIGHT + PAGE_MARGIN), DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT),
    margins: clone(margins),
    measures: measureElements(pageGroup.elements),
  };

  for (const element of pageGroup.elements) {
    element.parent = page;
  }
  pages.push(page);

  return new FlexGroupElement<PageElement>({ box: clone(pageContentBox), axis: "vertical" });
}

function measureElements(pageElements: PageElement[]): Measure[] {
  return pageElements.flatMap((e) => {
    if (e.type != "PageLine") {
      return [];
    }

    return e.measures;
  });
}

function layOutPartHeader(
  pageGroup: FlexGroupElement<PageElement>,
  score: notation.Score,
  part: notation.Part,
  contentWidth: number
) {
  // Lay out the composition title, composer, etc
  if (score.title) {
    const height = 4 * STAFF_LINE_HEIGHT;
    pageGroup.addElement(
      {
        type: "Text",
        box: new Box(0, 0, contentWidth, height),
        halign: "middle",
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
        halign: "end",
        size: height,
        value: score.composer,
        style: {
          fontFamily: "serif",
        },
      },
      { factor: 0 }
    );
  }

  if (score.comments) {
    const height = STAFF_LINE_HEIGHT;
    for (const comment of score.comments) {
      pageGroup.addElement(
        {
          type: "Text",
          box: new Box(0, 0, contentWidth, 1.5 * height),
          halign: "middle",
          size: height,
          value: comment,
          style: {
            fontFamily: "serif",
            fontStyle: "italic",
          },
        },
        { factor: 0 }
      );
    }
  }

  if (part.instrument && part.instrument.tuning) {
    // TODO show alternative name for tuning
    const textSize = STAFF_LINE_HEIGHT;
    const stringNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦"].slice(0, part.lineCount).reverse();
    const texts: Text[] = part.instrument.tuning.map((pitch, index) => ({
      type: "Text",
      box: new Box(0, 0, textSize * 5, textSize),
      size: textSize,
      value: `${stringNumbers[index]} = ${pitch}`,
      style: {
        fontFamily: "serif",
      },
    }));

    const offset = Math.round(texts.length / 2);
    for (let index = 0; index < offset; ++index) {
      const group = new SimpleGroup<LineElement>(new Box(0, 0, textSize * 10, 1.3 * textSize));
      group.addElement(texts[index]);

      if (offset + index < texts.length) {
        const text = texts[offset + index];
        text.box.x = textSize * 5;
        group.addElement(text);
      }

      pageGroup.addElement(group, { factor: 0 });
    }
  }
}
