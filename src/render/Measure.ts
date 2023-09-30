import layout from "../layout";
import { RenderFunc } from "./types";

export const Measure: RenderFunc<layout.Measure> = (element, render) => {
  if (!element.measure.isValid) {
    render.fillStyle = "#ff000011";
    render.fillRect(element.box.x, element.box.y, element.box.width, element.box.height);
  }
};
