import * as layout from "../../../layout";
import { LINE_STROKE_WIDTH } from "../../../layout";

export const Line = (context: CanvasRenderingContext2D, element: layout.Line) => {
  context.strokeStyle = `${LINE_STROKE_WIDTH} ${element.color}`;
  context.beginPath();
  context.moveTo(element.box.x, element.box.y);
  context.lineTo(element.box.right, element.box.bottom);
  context.stroke();
  context.closePath();
};
