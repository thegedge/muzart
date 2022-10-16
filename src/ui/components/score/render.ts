import { Box, LayoutElement, LINE_STROKE_WIDTH } from "../../../layout";
import { Application } from "../../state/Application";

export const render = (
  application: Application,
  context: CanvasRenderingContext2D,
  element: LayoutElement,
  viewport: Box
) => {
  if (!element.box.overlaps(viewport)) return;

  context.save();
  try {
    element.render?.(context);

    if (application.debug.enabled) {
      context.lineWidth = LINE_STROKE_WIDTH;
      context.strokeStyle = "red";
      context.strokeRect(element.box.x, element.box.y, element.box.width, element.box.height);
    }

    if (element.children && element.children.length > 0) {
      context.translate(element.box.x, element.box.y);
      const adjustedViewport = viewport.translate(-element.box.x, -element.box.y);
      for (const child of element.children) {
        render(application, context, child, adjustedViewport);
      }
    }
  } finally {
    context.restore();
  }
};
