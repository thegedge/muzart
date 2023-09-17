import layout, { LINE_STROKE_WIDTH } from "../layout";
import { RenderFunc } from "./types";

export const Line: RenderFunc<layout.Line> = (element, context) => {
  context.lineWidth = LINE_STROKE_WIDTH;
  context.strokeStyle = element.color;
  context.beginPath();
  context.moveTo(element.box.x, element.box.y);
  context.lineTo(element.box.right, element.box.bottom);
  context.stroke();
  context.closePath();
};
