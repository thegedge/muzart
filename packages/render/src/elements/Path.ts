import * as layout from "@muzart/layout";
import type { RenderFunc } from "../types";

export const Path: RenderFunc<layout.Path> = (element, render) => {
  if (render.fillStyle != "transparent") render.fill(element.path);
  if (render.strokeStyle != "transparent") render.stroke(element.path);
};
