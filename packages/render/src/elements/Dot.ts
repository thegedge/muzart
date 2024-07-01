import * as layout from "@muzart/layout";
import { RenderFunc } from "../types";

export const Dot: RenderFunc<layout.Dot> = (element, render) => {
  const w = element.box.width;
  const h = element.box.height;
  render.beginPath();
  render.ellipse(element.box.centerX, element.box.centerY, 0.25 * w, 0.25 * h, 0, 0, 2 * Math.PI);
  render.fill();
  render.closePath();
};
