import layout from "../layout";
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
import { Rest } from "./Rest";
import { Slide } from "./Slide";
import { Stroke } from "./Stroke";
import { Text } from "./Text";
import { TimeSignature } from "./TimeSignature";
import { Vibrato } from "./Vibrato";
import { RenderContext, RenderFunc } from "./types";

export const renderScoreElement = (
  element: layout.AllElements,
  renderContext: CanvasRenderingContext2D,
  context: RenderContext,
) => {
  if (!element.box.overlaps(context.viewport)) {
    return;
  }

  renderContext.save();
  try {
    RenderFunctions[element.type]?.(element, renderContext, context);

    if ("children" in element && element.children.length > 0) {
      renderContext.translate(element.box.x, element.box.y);
      const adjustedViewport = context.viewport.translate(-element.box.x, -element.box.y);
      for (const child of element.children) {
        renderScoreElement(child, renderContext, {
          ...context,
          viewport: adjustedViewport,
        });
      }
      renderContext.translate(-element.box.x, -element.box.y);
    }

    // We render after children so that the parent containers are clearly visible
    if (context.application.debug.enabled) {
      const params = context.application.debug.paramsForType(element.type);
      if (params) {
        renderContext.strokeStyle = params.strokeStyle;
        renderContext.lineWidth = params.lineWidth;
        renderContext.fillStyle = params.fillStyle;
        renderContext.setLineDash(params.dashArray);
        renderContext.strokeRect(element.box.x, element.box.y, element.box.width, element.box.height);
        renderContext.setLineDash([]);
      }
    }
  } finally {
    renderContext.restore();
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
  Rest,
  Slide,
  Stroke,
  Text,
  TimeSignature,
  Vibrato,
};
