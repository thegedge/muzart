import * as notation from "@muzart/notation";
import { DEFAULT_MARGIN, DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH } from "./constants";
import { Measure } from "./elements/Measure";
import { Page } from "./elements/Page";
import { Part } from "./elements/Part";
import { PartHeader } from "./elements/PartHeader";
import { Score } from "./elements/Score";
import { Space } from "./elements/Space";
import { PageLine } from "./elements/pageline/PageLine";
import type { LayoutContext } from "./types";
import { Box } from "./utils/Box";

/**
 * Return a layout for the given score.
 *
 * The score is laid out assuming a 8.5" x 11" page. Each page is laid out as a series of lines that will be stacked
 * vertically. For example, the first page will often be some lines of text describing the composition (name,
 * artist, etc) followed by many staff lines.
 */
export const layOutScore = (score: notation.Score, partIndexes: [number], options?: Partial<LayoutContext>): Score => {
  const context: LayoutContext = {
    layoutMode: "normal",
    ...options,
  };

  console.time("layout");
  try {
    const layoutScore = new Score(score);
    for (const partIndex of partIndexes) {
      const layoutPart = layOutPart(score, score.parts[partIndex], context);
      layoutScore.addElement(layoutPart);
    }

    layoutScore.layout();
    return layoutScore;
  } finally {
    console.timeEnd("layout");
  }
};

const layOutPart = (score: notation.Score, part: notation.Part, context: LayoutContext): Part => {
  switch (context.layoutMode) {
    case "normal":
      return layOutPartNormal(score, part, context);
    case "compact":
      return layOutPartCompact(score, part, context);
    default:
      throw new Error(`unknown layout style: ${context.layoutMode}`);
  }
};

const layOutPartNormal = (score: notation.Score, part: notation.Part, context: LayoutContext): Part => {
  const measures = part.measures;
  const layoutPart = new Part(Box.empty(), part, context);

  const newPage = () => new Page(new Box(0, 0, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT));

  let page = newPage();

  const contentWidth = page.content.box.width;
  const partHeader = new PartHeader(score, part, contentWidth, context);
  partHeader.layout();
  page.content.addElement(partHeader, 0);

  let isFirstLine = true;
  let line = new PageLine(new Box(0, 0, contentWidth, 0), part.lineCount);
  for (const measureToLayOut of measures) {
    const measure = new Measure(part, measureToLayOut);
    layoutPart.measures.push(measure);

    // Determine if we need to be on a new line.
    //
    // When "committing" the current line, it may be too large to fit on the current page, in which case we'll also
    // start a new page.

    if (isFirstLine) {
      line.addElement(measure, measureToLayOut.chords.length);
      line.addBarLine();
      isFirstLine = false;
    } else if (line.tryAddElement(measure, measureToLayOut.chords.length)) {
      line.addBarLine();
    } else {
      line.layout();

      if (!page.content.tryAddElement(line)) {
        layoutPart.addElement(page);
        page = newPage();
        page.content.addElement(line);
      }

      line = new PageLine(new Box(0, 0, contentWidth, 0), part.lineCount);
      line.addElement(measure, measureToLayOut.chords.length);
      line.addBarLine();
      isFirstLine = true;
    }
  }

  if (line.children.length > 0) {
    line.layout();

    if (!page.content.tryAddElement(line)) {
      layoutPart.addElement(page);
      page = newPage();
      page.content.addElement(line);
    }
  }

  if (page.content.children.length > 0) {
    layoutPart.addElement(page);
  }

  // Add a high factor spacer to the last page so the page lines are all at the top
  page.content.addElement(new Space(), 100000);

  return layoutPart;
};

const layOutPartCompact = (score: notation.Score, part: notation.Part, context: LayoutContext): Part => {
  const measures = part.measures;
  const layoutPart = new Part(Box.empty(), part, context);

  const newPage = () =>
    new Page(new Box(0, 0, Math.ceil(0.75 * DEFAULT_PAGE_WIDTH), DEFAULT_PAGE_HEIGHT), {
      top: DEFAULT_MARGIN / 2,
      left: DEFAULT_MARGIN / 2,
      right: DEFAULT_MARGIN / 2,
      bottom: DEFAULT_MARGIN / 2,
    });

  let page = newPage();

  const contentWidth = page.content.box.width;
  const partHeader = new PartHeader(score, part, contentWidth, context);
  partHeader.layout();
  page.content.addElement(partHeader, 0);

  let isFirstLine = true;
  let line = new PageLine(new Box(0, 0, contentWidth, 0), part.lineCount);
  for (const measureToLayOut of measures) {
    const measure = new Measure(part, measureToLayOut);
    layoutPart.measures.push(measure);

    // Determine if we need to be on a new line.
    //
    // When "committing" the current line, it may be too large to fit on the current page, in which case we'll also
    // start a new page.

    if (isFirstLine) {
      line.addElement(measure, measureToLayOut.chords.length);
      line.addBarLine();
      isFirstLine = false;
    } else if (line.tryAddElement(measure, measureToLayOut.chords.length)) {
      line.addBarLine();
    } else {
      line.layout();

      if (!page.content.tryAddElement(line)) {
        layoutPart.addElement(page);
        page = newPage();
        page.content.addElement(line);
      }

      line = new PageLine(new Box(0, 0, contentWidth, 0), part.lineCount);
      line.addElement(measure, measureToLayOut.chords.length);
      line.addBarLine();
      isFirstLine = true;
    }
  }

  if (line.children.length > 0) {
    line.layout();

    if (!page.content.tryAddElement(line)) {
      layoutPart.addElement(page);
      page = newPage();
      page.content.addElement(line);
    }
  }

  if (page.content.children.length > 0) {
    layoutPart.addElement(page);
  }

  // Add a high factor spacer to the last page so the page lines are all at the top
  page.content.addElement(new Space(), 100000);

  return layoutPart;
};
