import { last } from "lodash";
import * as notation from "../notation";
import { DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH, STAFF_LINE_HEIGHT } from "./constants";
import { Measure } from "./elements/Measure";
import { Page } from "./elements/Page";
import { PageLine } from "./elements/PageLine";
import { PAGE_MARGIN, Part } from "./elements/Part";
import { Text } from "./elements/Text";
import { FlexGroupElement } from "./layouts/FlexGroup";
import { SimpleGroupElement } from "./layouts/SimpleGroup";
import { Group, LineElement, PageElement, Score } from "./types";
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
    const parts = score.parts.map((part) => layOutPart(score, part));
    return {
      type: "Score",
      score,
      parts,
      box: Box.encompass(...parts.map((p) => p.box)).update({ x: 0, y: 0 }),
    };
  } finally {
    console.timeEnd("layout");
  }
}

// TODO decompose this more, move into other files (e.g., `Line.fromMeasures`)

function layOutPart(score: notation.Score, part: notation.Part): Part {
  const measures = part.measures;
  const layoutPart = new Part(Box.empty(), part);

  let page = new Page(new Box(0, 0, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT));

  const contentWidth = page.content.box.width;
  const header = partHeader(score, part, contentWidth);
  page.content.addElement(header, { factor: 0 });

  let isFirstLine = true;
  let line = new PageLine(new Box(0, 0, contentWidth, 0), part.lineCount);
  for (const measureToLayOut of measures) {
    const measure = new Measure(part, measureToLayOut);

    // Determine if we need to be on a new line.
    //
    // When "committing" the current line, it may be too large to fit on the current page, in which case we'll also
    // start a new page.

    if (isFirstLine) {
      line.addElement(measure, { factor: measureToLayOut.chords.length });
      line.addBarLine();
      isFirstLine = false;
    } else if (line.tryAddElement(measure, { factor: measureToLayOut.chords.length })) {
      line.addBarLine();
    } else {
      line.layout();

      if (!page.content.tryAddElement(line, { factor: null })) {
        layoutPart.addElement(page);
        page = new Page(new Box(0, page.box.bottom + PAGE_MARGIN, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT));
        page.content.addElement(line);
      }

      line = new PageLine(new Box(0, 0, contentWidth, 0), part.lineCount);
      line.addElement(measure, { factor: measureToLayOut.chords.length });
      line.addBarLine();
      isFirstLine = true;
    }
  }

  // TODO a lot of code here is shared with the loop above

  if (line.elements.length > 0) {
    line.layout();

    if (!page.content.tryAddElement(line)) {
      layoutPart.addElement(page);
      page = new Page(new Box(0, page.box.bottom + PAGE_MARGIN, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT));
      page.content.addElement(line);
    }
  }

  if (page.content.elements.length > 0) {
    layoutPart.addElement(page, false);
  }

  layoutPart.layout();

  return layoutPart;
}

function partHeader(score: notation.Score, part: notation.Part, contentWidth: number): Group<PageElement> {
  const headerGroup = new FlexGroupElement<PageElement>({
    box: new Box(0, 0, contentWidth, 0),
    axis: "vertical",
    defaultFlexProps: { factor: null },
  });

  // Lay out the composition title, composer, etc
  if (score.title) {
    const height = 4 * STAFF_LINE_HEIGHT;
    headerGroup.addElement(
      new Text({
        box: new Box(0, 0, contentWidth, height),
        halign: "middle",
        size: height,
        value: score.title,
        style: {
          fontFamily: "serif",
        },
      })
    );
  }

  if (score.composer) {
    const height = 1.5 * STAFF_LINE_HEIGHT;

    headerGroup.addElement(
      new Text({
        box: new Box(0, 0, contentWidth, 2 * height),
        halign: "end",
        size: height,
        value: score.composer,
        style: {
          fontFamily: "serif",
        },
      })
    );
  }

  if (score.comments) {
    const height = STAFF_LINE_HEIGHT;
    for (const comment of score.comments) {
      headerGroup.addElement(
        new Text({
          box: new Box(0, 0, contentWidth, 1.5 * height),
          halign: "middle",
          size: height,
          value: comment,
          style: {
            fontFamily: "serif",
            fontStyle: "italic",
          },
        })
      );
    }
  }

  if (part.instrument && part.instrument.tuning) {
    // TODO show alternative name for tuning
    const textSize = STAFF_LINE_HEIGHT;
    const stringNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦"].slice(0, part.lineCount).reverse();
    const texts: Text[] = part.instrument.tuning.map(
      (pitch, index) =>
        new Text({
          box: new Box(0, 0, textSize * 5, textSize),
          size: textSize,
          value: `${stringNumbers[index]} = ${pitch}`,
          style: {
            fontFamily: "serif",
          },
        })
    );

    const offset = Math.round(texts.length / 2);
    for (let index = 0; index < offset; ++index) {
      const group = new SimpleGroupElement<LineElement>(new Box(0, 0, textSize * 10, 1.3 * textSize));
      group.addElement(texts[index]);

      if (offset + index < texts.length) {
        const text = texts[offset + index];
        text.box.x = textSize * 5;
        group.addElement(text);
      }

      headerGroup.addElement(group);
    }
  }

  headerGroup.layout();
  headerGroup.box.height = last(headerGroup.elements)?.box.bottom ?? 0;

  return headerGroup;
}
