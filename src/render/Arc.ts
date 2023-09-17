import layout, { LINE_STROKE_WIDTH } from "../layout";
import { RenderFunc } from "./types";

export const Arc: RenderFunc<layout.Arc> = (element, render) => {
  const l = element.box.x;
  const t = element.box.y;
  const r = element.box.right;
  const b = element.box.bottom;
  const w = element.box.width;
  const offset = 3 * LINE_STROKE_WIDTH;

  render.lineCap = "round";
  render.fillStyle = "#555555";
  render.beginPath();

  switch (element.orientation) {
    case "above":
      render.moveTo(l, b);
      render.bezierCurveTo(l + w * 0.3, t, l + w * 0.7, t, r, b);
      render.bezierCurveTo(l + w * 0.7, t + offset, l + w * 0.3, t + offset, l, b);
      break;
    case "below":
      render.moveTo(l, t);
      render.bezierCurveTo(l + w * 0.3, b, l + w * 0.7, b, r, t);
      render.bezierCurveTo(l + w * 0.7, b - offset, l + w * 0.3, b - offset, l, t);
      break;
  }

  render.fill();
  render.closePath();
};
