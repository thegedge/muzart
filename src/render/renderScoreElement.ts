import * as CSS from "csstype";
import { merge } from "lodash";
import layout from "../layout";
import { Arc } from "./Arc";
import { BarLine } from "./BarLine";
import { Beam } from "./Beam";
import { Bend } from "./Bend";
import { ChordDiagram } from "./ChordDiagram";
import { DecoratedText } from "./DecoratedText";
import { Dot } from "./Dot";
import { Line } from "./Line";
import { Page } from "./Page";
import { Rest } from "./Rest";
import { Stroke } from "./Stroke";
import { Text } from "./Text";
import { TimeSignature } from "./TimeSignature";
import { Vibrato } from "./Vibrato";
import { RenderContext, RenderFunc } from "./types";

const BOX_SHADOW_REGEX =
  /^(?<color>(#?\w+|(rgba?|hsl|hwb|lab|lch|oklab|oklch)\(.+?\)|\w+))(?<offsetX> \d+\w*)?(?<offsetY> \d+\w*)?(?<blur> \d+\w*)?(?<spread> \d+\w*)?$/;
``;

export const renderScoreElement = (
  element: layout.AllElements,
  renderContext: CanvasRenderingContext2D,
  context: RenderContext,
) => {
  if (!element.box.overlaps(context.viewport)) {
    return;
  }

  const stylesBefore = context.style;
  const styles = merge(context.styling.stylesFor(element, context.ancestors), element.style);
  if (styles.display == "none") {
    return;
  }

  renderContext.save();
  try {
    context.style = styles;

    // We'll handle background + box shadow here
    if (context.style.backgroundColor || context.style.boxShadow) {
      if (context.style.boxShadow) {
        if (context.style.boxShadow.includes("inset")) {
          console.warn("inset box shadows not supported");
        } else {
          const parts = context.style.boxShadow.trim().match(BOX_SHADOW_REGEX);
          if (parts) {
            renderContext.shadowColor = parts.groups?.["color"] ?? "";
            renderContext.shadowOffsetX = parseInt(parts.groups?.["offsetX"] ?? "0");
            renderContext.shadowOffsetY = parseInt(parts.groups?.["offsetY"] ?? "0");
            renderContext.shadowBlur = parseInt(parts.groups?.["blur"] ?? "0");
          }
        }
      }

      renderContext.fillStyle = context.style.backgroundColor ?? "";
      renderContext.fillRect(element.box.x, element.box.y, element.box.width, element.box.height);

      renderContext.fillStyle = "";
      renderContext.shadowBlur = 0;
      renderContext.shadowColor = "";
      renderContext.shadowOffsetX = 0;
      renderContext.shadowOffsetY = 0;
    }

    applyStylesToRenderContext(renderContext, styles);

    RenderFunctions[element.type]?.(element, renderContext, context);

    // Render children, if any
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
    context.style = stylesBefore;
    renderContext.restore();
  }
};

const applyStylesToRenderContext = (renderContext: CanvasRenderingContext2D, styles: CSS.Properties) => {
  // TODO we don't do a lot of double checking on whether or not the styles we're assigning work for canvas

  if (styles.alignmentBaseline) {
    renderContext.textBaseline = styles.alignmentBaseline as CanvasTextBaseline;
  }

  if (styles.fill) {
    renderContext.fillStyle = styles.fill;
  }

  if (styles.stroke) {
    renderContext.strokeStyle = styles.stroke;
  }

  if (styles.strokeLinecap) {
    renderContext.lineCap = styles.strokeLinecap as CanvasLineCap;
  }

  if (styles.strokeWidth) {
    renderContext.lineWidth = Number(styles.strokeWidth);
  }

  if (styles.textAlign) {
    renderContext.textAlign = styles.textAlign as CanvasTextAlign;
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
  Page,
  Rest,
  Stroke,
  Text,
  TimeSignature,
  Vibrato,
};
