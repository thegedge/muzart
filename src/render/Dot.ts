import layout from "../layout";
import { Application } from "../ui/state/Application";

export const Dot = (_application: Application, context: CanvasRenderingContext2D, element: layout.Dot) => {
  const w = element.box.width;
  const h = element.box.height;
  context.fillStyle = "#000000";
  context.beginPath();
  context.ellipse(element.box.centerX, element.box.centerY, 0.25 * w, 0.25 * h, 0, 0, 2 * Math.PI);
  context.fill();
  context.closePath();
};
