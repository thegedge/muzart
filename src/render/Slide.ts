import layout, { Box, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../layout";
import { Arc } from "./Arc";
import { RenderFunc } from "./types";

export const Slide: RenderFunc<layout.Slide> = (element, render, context) => {
  render.beginPath();
  if (element.upwards) {
    render.moveTo(element.box.x, element.box.y);
    render.lineTo(element.box.right, element.box.bottom);
  } else {
    render.moveTo(element.box.x + 5 * LINE_STROKE_WIDTH, element.box.bottom);
    render.lineTo(element.box.right - 5 * LINE_STROKE_WIDTH, element.box.y);
  }
  render.stroke();
  render.closePath();

  Arc(
    {
      type: "Arc",
      parent: element.parent,
      box: new Box(
        element.box.x - 0.5 * STAFF_LINE_HEIGHT,
        element.box.y - STAFF_LINE_HEIGHT,
        element.box.width + STAFF_LINE_HEIGHT,
        0.8 * STAFF_LINE_HEIGHT,
      ),
      orientation: "above",
    },
    render,
    context,
  );
};
