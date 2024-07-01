import * as layout from "@muzart/layout";
import { RenderFunc } from "../types";

export const Ellipse: RenderFunc<layout.Ellipse> = (element, render, context) => {
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
  if (context.style.fill) render.fill();
  if (context.style.stroke) render.stroke();
};
