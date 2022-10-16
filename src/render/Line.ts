import layout, { LINE_STROKE_WIDTH } from "../layout";
import { Application } from "../ui/state/Application";

export const Line = (_application: Application, context: CanvasRenderingContext2D, element: layout.Line) => {
  context.lineWidth = LINE_STROKE_WIDTH;
  context.strokeStyle = element.color;
  context.beginPath();
  context.moveTo(element.box.x, element.box.y);
  context.lineTo(element.box.right, element.box.bottom);
  context.stroke();
  context.closePath();
};
