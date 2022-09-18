import * as layout from "../../../layout";
import { Box, LINE_STROKE_WIDTH } from "../../../layout";
import { Application } from "../../state/Application";
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

type RenderFunc<E = layout.AllElements> = (
  application: Application,
  context: CanvasRenderingContext2D,
  element: E
) => void;

export const ScoreElement = (
  application: Application,
  context: CanvasRenderingContext2D,
  element: layout.AllElements,
  viewport: Box
) => {
  if (!element.box.overlaps(viewport)) return;

  context.save();
  try {
    RenderFunctions[element.type]?.(application, context, element);

    if (application.debug.enabled) {
      context.lineWidth = LINE_STROKE_WIDTH;
      context.strokeStyle = "red";
      context.strokeRect(element.box.x, element.box.y, element.box.width, element.box.height);
    }

    if ("children" in element && element.children.length > 0) {
      context.translate(element.box.x, element.box.y);
      const adjustedViewport = viewport.translate(-element.box.x, -element.box.y);
      for (const child of element.children) {
        ScoreElement(application, context, child, adjustedViewport);
      }
    }
  } finally {
    context.restore();
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RenderFunctions: Record<string, RenderFunc<any>> = {
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
