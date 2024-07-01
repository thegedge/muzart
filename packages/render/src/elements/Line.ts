import * as layout from "@muzart/layout";
import { RenderFunc } from "../types";

export const Line: RenderFunc<layout.Line> = (element, render) => {
  render.beginPath();
  render.moveTo(element.box.x, element.box.y);
  render.lineTo(element.box.right, element.box.bottom);
  render.stroke();
};
