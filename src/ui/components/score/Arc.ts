import layout, { LINE_STROKE_WIDTH } from "../../../layout";
import { Application } from "../../state/Application";

export const Arc = (_application: Application, context: CanvasRenderingContext2D, element: layout.Arc) => {
  const l = element.box.x;
  const t = element.box.y;
  const r = element.box.right;
  const b = element.box.bottom;
  const w = element.box.width;
  const offset = 3 * LINE_STROKE_WIDTH;

  context.lineCap = "round";
  context.fillStyle = "#555555";
  context.beginPath();

  switch (element.orientation) {
    case "above":
      context.moveTo(l, b);
      context.bezierCurveTo(l + w * 0.3, t, l + w * 0.7, t, r, b);
      context.bezierCurveTo(l + w * 0.7, t + offset, l + w * 0.3, t + offset, l, b);
      break;
    case "below":
      context.moveTo(l, t);
      context.bezierCurveTo(l + w * 0.3, b, l + w * 0.7, b, r, t);
      context.bezierCurveTo(l + w * 0.7, b - offset, l + w * 0.3, b - offset, l, t);
      break;
  }

  context.fill();
  context.closePath();
};
