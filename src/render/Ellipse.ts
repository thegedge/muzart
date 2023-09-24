import layout from "../layout";
import { RenderFunc } from "./types";

export const Ellipse: RenderFunc<layout.Ellipse> = (element, render) => {
  render.beginPath();
  render.moveTo(element.box.x, element.box.y);
  render.ellipse(
    element.box.centerX,
    element.box.centerY,
    0.5 * element.box.width,
    0.5 * element.box.height,
    0,
    0,
    2 * Math.PI,
  );
  if (element.style?.fill) render.fill();
  if (element.style?.stroke) render.stroke();
};
