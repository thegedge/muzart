import layout from "../layout";
import { RenderFunc } from "./types";

export const Line: RenderFunc<layout.Line> = (element, render) => {
  render.strokeStyle = element.color; // TODO maybe have some of these be in CSS
  render.beginPath();
  render.moveTo(element.box.x, element.box.y);
  render.lineTo(element.box.right, element.box.bottom);
  render.stroke();
  render.closePath();
};
