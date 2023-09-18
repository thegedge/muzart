import layout from "../layout";
import { PAGE_MARGIN } from "../layout/elements/Part";
import { RenderFunc } from "./types";

export const Page: RenderFunc<layout.Page> = (element, render) => {
  render.save();
  render.shadowBlur = PAGE_MARGIN;
  render.shadowColor = "rgb(0, 0, 0, 0.25)";
  render.fillRect(element.box.x, element.box.y, element.box.width, element.box.height);
  render.shadowBlur = 0;
  render.shadowColor = "";
  render.restore();

  const box = element.content.box.translate(element.box.x, element.box.y);
  render.beginPath();
  render.rect(box.x, box.y, box.width, box.height);
  render.clip();
  render.closePath();
};
