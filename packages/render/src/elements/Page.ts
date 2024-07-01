import * as layout from "@muzart/layout";
import { RenderFunc } from "../types";

export const Page: RenderFunc<layout.Page> = (element, render) => {
  // TODO implement clip in CSS
  const box = element.content.box.translate(element.box.x, element.box.y);
  render.beginPath();
  render.rect(box.x, box.y, box.width, box.height);
  render.clip();
  render.closePath();
};
