import layout, { Box } from "../layout";
import { Application } from "../ui/state/Application";
import { Arc } from "./Arc";
import { BarLine } from "./BarLine";
import { Beam } from "./Beam";
import { Bend } from "./Bend";
import { ChordDiagram } from "./ChordDiagram";
import { DecoratedText } from "./DecoratedText";
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

export const renderScoreElement = (
  application: Application,
  context: CanvasRenderingContext2D,
  element: layout.AllElements,
  viewport: Box
) => {
  if (!element.box.overlaps(viewport)) {
    return;
  }

  context.save();
  try {
    RenderFunctions[element.type]?.(application, context, element);

    if ("children" in element && element.children.length > 0) {
      context.translate(element.box.x, element.box.y);
      const adjustedViewport = viewport.translate(-element.box.x, -element.box.y);
      for (const child of element.children) {
        renderScoreElement(application, context, child, adjustedViewport);
      }
      context.translate(-element.box.x, -element.box.y);
    }

    // We render after children so that the parent containers are clearly visible
    if (application.debug.enabled) {
      const params = application.debug.paramsForType(element.type);
      if (params) {
        context.strokeStyle = params.strokeStyle;
        context.lineWidth = params.lineWidth;
        context.fillStyle = params.fillStyle;
        context.setLineDash(params.dashArray);
        context.strokeRect(element.box.x, element.box.y, element.box.width, element.box.height);
        context.setLineDash([]);
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
  DecoratedText,
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
