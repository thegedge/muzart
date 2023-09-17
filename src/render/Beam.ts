import layout from "../layout";
import { RenderFunc } from "./types";

const BEAM_COLOR = "#333333";

export const Beam: RenderFunc<layout.Beam> = (element, render) => {
  render.fillStyle = BEAM_COLOR;

  if (element.size == element.box.height) {
    render.fillRect(element.box.x, element.box.y, element.box.width, element.box.height);
    return;
  }

  const x1 = element.box.x;
  const y1 = element.box.y;
  const x2 = element.box.right;
  const y2 = element.box.bottom;
  const sz = element.size;

  render.beginPath();
  render.moveTo(x1, y2);
  render.lineTo(x2, y1 + sz);
  render.lineTo(x2, y1);
  render.lineTo(x1, y2 - sz);
  render.fill();
  render.closePath();
};
