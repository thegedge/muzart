import layout from "../layout";
import { RenderFunc } from "./types";

export const Path: RenderFunc<layout.Path> = (element, render) => {
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
  render.fill(element.path);
  render.stroke(element.path);
};
