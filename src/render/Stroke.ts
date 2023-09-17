import layout, { LINE_STROKE_WIDTH } from "../layout";
import { StrokeDirection } from "../notation";
import { RenderFunc } from "./types";

export const Stroke: RenderFunc<layout.Stroke> = (element, render) => {
  render.fillStyle = "#000000";
  render.strokeStyle = "#000000";
  render.lineWidth = LINE_STROKE_WIDTH;

  switch (element.stroke.direction) {
    case StrokeDirection.Down: {
      render.fillRect(element.box.x, element.box.y, element.box.width, 0.5 * element.box.height);
      render.beginPath();
      render.moveTo(element.box.x, element.box.y);
      render.lineTo(element.box.x, element.box.bottom);
      render.moveTo(element.box.right, element.box.y);
      render.lineTo(element.box.right, element.box.bottom);
      render.stroke();
      render.closePath();
      break;
    }
    case StrokeDirection.Up: {
      const path = `
        M ${element.box.x} ${element.box.bottom}
        L ${element.box.centerX} 0
        L ${element.box.right} ${element.box.bottom}
      `;
      render.stroke(new Path2D(path));
      break;
    }
  }
};
