import * as layout from "@muzart/layout";
import type * as CSS from "csstype";
import { merge } from "lodash-es";
import { Arc } from "./elements/Arc";
import { BarLine } from "./elements/BarLine";
import { Beam } from "./elements/Beam";
import { DecoratedText } from "./elements/DecoratedText";
import { Dot } from "./elements/Dot";
import { Ellipse } from "./elements/Ellipse";
import { Line } from "./elements/Line";
import { Page } from "./elements/Page";
import { Path } from "./elements/Path";
import { Rest } from "./elements/Rest";
import { Stroke } from "./elements/Stroke";
import { Text } from "./elements/Text";
import { TimeSignature } from "./elements/TimeSignature";
import { Vibrato } from "./elements/Vibrato";
import type { RenderContext, RenderFunc } from "./types";

const BOX_SHADOW_REGEX =
  /^(?<color>(#?\w+|(rgba?|hsl|hwb|lab|lch|oklab|oklch)\(.+?\)|\w+))(?<offsetX> \d+\w*)?(?<offsetY> \d+\w*)?(?<blur> \d+\w*)?(?<spread> \d+\w*)?$/;
``;

export const renderScoreElement = (
  element: layout.AnyLayoutElement,
  renderContext: CanvasRenderingContext2D,
  context: RenderContext,
) => {
  if (!element.box.overlaps(context.viewport)) {
    return;
  }

  const parentStyles = context.style;
  const styles = merge(
    {
      color: parentStyles.color,
      fill: parentStyles.fill,
      stroke: parentStyles.stroke,
    },
    context.styler.stylesFor(element, context.ancestors),
    element.style,
  );
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

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    RenderFunctions[element.type]?.(element, renderContext, context);

    // Render children, if any
    if (element.children?.length) {
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
    if (context.debug?.highlightedElement && layout.isAncestor(element, context.debug.highlightedElement)) {
      const params = context.debug.paramsForType(element.type);
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
    context.style = parentStyles;
    renderContext.restore();
  }
};

const applyStylesToRenderContext = (renderContext: CanvasRenderingContext2D, styles: CSS.Properties) => {
  // TODO we don't do a lot of double checking on whether or not the styles we're assigning work for canvas

  const currentColor = styles.color as string | CanvasGradient | CanvasPattern;

  switch (styles.fill) {
    case undefined:
      // Inherited
      break;
    case "none":
      renderContext.fillStyle = "transparent";
      break;
    case "currentcolor":
      renderContext.fillStyle = currentColor;
      break;
    default:
      renderContext.fillStyle = styles.fill;
      break;
  }

  switch (styles.stroke) {
    case undefined:
      // Inherited
      break;
    case "none":
      renderContext.strokeStyle = "transparent";
      break;
    case "currentcolor":
      renderContext.strokeStyle = currentColor;
      break;
    default:
      renderContext.strokeStyle = styles.stroke;
      break;
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

  if (styles.alignmentBaseline) {
    renderContext.textBaseline = styles.alignmentBaseline as CanvasTextBaseline;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RenderFunctions: Record<string, RenderFunc<any>> = {
  Arc,
  BarLine,
  Beam,
  DecoratedText,
  Dot,
  Ellipse,
  Line,
  Page,
  Path,
  Rest,
  Stroke,
  Text,
  TimeSignature,
  Vibrato,
};
