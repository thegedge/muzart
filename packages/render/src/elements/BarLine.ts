import * as layout from "@muzart/layout";
import type { RenderFunc } from "../types";

export const BarLine: RenderFunc<layout.BarLine> = (element, render) => {
  render.lineWidth = element.strokeSize;
  render.beginPath();
  render.moveTo(element.box.centerX, element.box.y);
  render.lineTo(element.box.centerX, element.box.bottom);
  render.stroke();
  render.closePath();
};
