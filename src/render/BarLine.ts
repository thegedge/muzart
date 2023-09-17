import layout from "../layout";
import { RenderFunc } from "./types";

export const BarLine: RenderFunc<layout.BarLine> = (element, context) => {
  context.lineWidth = element.strokeSize;
  context.strokeStyle = "#000000";
  context.beginPath();
  context.moveTo(element.box.centerX, element.box.y);
  context.lineTo(element.box.centerX, element.box.bottom);
  context.stroke();
  context.closePath();
};
