import * as layout from "../../../layout";

export const Dot = (context: CanvasRenderingContext2D, element: layout.Dot) => {
  const w = element.box.width;
  const h = element.box.height;
  context.fillStyle = "#000000";
  context.beginPath();
  context.ellipse(element.box.centerX, element.box.centerY, 0.25 * w, 0.25 * h, 0, 0, 2 * Math.PI);
  context.fill();
  context.closePath();
};
