import * as layout from "../../../layout";
import { Box } from "../../../layout";
import { Arc } from "./Arc";
import { BarLine } from "./BarLine";
import { Beam } from "./Beam";
import { Bend } from "./Bend";
import { ChordDiagram } from "./ChordDiagram";
import { DashedLineText } from "./DashedLineText";
import { Dot } from "./Dot";
import { Line } from "./Line";
import { Note } from "./Note";
import { Page } from "./Page";
import { Part } from "./Part";
import { Rest } from "./Rest";
import { Slide } from "./Slide";
import { Stroke } from "./Stroke";
import { Text } from "./Text";
import { TimeSignature } from "./TimeSignature";
import { Vibrato } from "./Vibrato";

type RenderFunc<E extends layout.AllElements = layout.AllElements> = (
  context: CanvasRenderingContext2D,
  element: E
) => void;

export const ScoreElement = (context: CanvasRenderingContext2D, element: layout.AllElements, viewport: Box) => {
  if (!element.box.overlaps(viewport)) return;

  context.save();
  try {
    if (element.type in RenderFunctions) {
      // TODO avoid the as casts
      const Render = RenderFunctions[element.type as keyof typeof RenderFunctions] as RenderFunc;
      Render(context, element);
    }

    if ("children" in element) {
      context.translate(element.box.x, element.box.y);
      const adjustedViewport = viewport.translate(-element.box.x, -element.box.y);
      for (const child of element.children) {
        ScoreElement(context, child, adjustedViewport);
      }
    }
  } finally {
    context.restore();
  }
};

const RenderFunctions = {
  Arc,
  BarLine,
  Bend,
  Beam,
  ChordDiagram,
  DashedLineText,
  Dot,
  Line,
  Note,
  Page,
  Part,
  Rest,
  Slide,
  Stroke,
  Text,
  TimeSignature,
  Vibrato,
};
