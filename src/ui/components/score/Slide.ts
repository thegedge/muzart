import layout, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { Arc } from "./Arc";

export const Slide = (context: CanvasRenderingContext2D, element: layout.Slide) => {
  context.strokeStyle = "#555555";
  context.lineWidth = 1.5 * LINE_STROKE_WIDTH;

  context.beginPath();
  if (element.upwards) {
    context.moveTo(element.box.x, element.box.y);
    context.lineTo(element.box.right, element.box.bottom);
  } else {
    context.moveTo(element.box.x + 5 * LINE_STROKE_WIDTH, element.box.bottom);
    context.lineTo(element.box.right - 5 * LINE_STROKE_WIDTH, element.box.y);
  }
  context.stroke();
  context.closePath();

  Arc(context, {
    type: "Arc",
    parent: element.parent,
    box: new Box(
      element.box.x - 0.5 * STAFF_LINE_HEIGHT,
      element.box.y - STAFF_LINE_HEIGHT,
      element.box.width + STAFF_LINE_HEIGHT,
      0.8 * STAFF_LINE_HEIGHT
    ),
    orientation: "above",
  });
};
