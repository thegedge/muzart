import * as notation from "../notation";
import { DEFAULT_PAGE_HEIGHT, DEFAULT_PAGE_WIDTH } from "./constants";
import { Measure } from "./elements/Measure";
import { Page } from "./elements/Page";
import { PageLine } from "./elements/pageline/PageLine";
import { Part } from "./elements/Part";
import { PartHeader } from "./elements/PartHeader";
import { Score } from "./elements/Score";
import { Box } from "./utils/Box";

/**
 * Return a layout for the given score.
 *
 * The score is laid out assuming a 8.5" x 11" page. Each page is laid out as a series of lines that will be stacked
 * vertically. For example, the first page will often be some lines of text describing the composition (name,
 * artist, etc) followed by many staff lines.
 */
export const layout = (score: notation.Score): Score => {
  console.time("layout");
  try {
    const layoutScore = new Score(score);
    for (const part of score.parts) {
      const layoutPart = layOutPart(score, part);
      layoutScore.addElement(layoutPart);
    }

    layoutScore.layout();
    return layoutScore;
  } finally {
    console.timeEnd("layout");
  }
};

function layOutPart(score: notation.Score, part: notation.Part): Part {
  const measures = part.measures;
  const layoutPart = new Part(Box.empty(), part);

  let page = new Page(new Box(0, 0, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT));

  const contentWidth = page.content.box.width;
  const partHeader = new PartHeader(score, part, contentWidth);
  partHeader.layout();
  page.content.addElement(partHeader, 0);

  let isFirstLine = true;
  let line = new PageLine(new Box(0, 0, contentWidth, 0), part.lineCount);
  for (const measureToLayOut of measures) {
    const measure = new Measure(part, measureToLayOut);

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
        page = new Page(new Box(0, 0, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT));
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
      page = new Page(new Box(0, 0, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT));
      page.content.addElement(line);
    }
  }

  if (page.content.children.length > 0) {
    layoutPart.addElement(page);
  }

  return layoutPart;
}
