import layout, { LINE_STROKE_WIDTH } from "../../../layout";
import { StrokeDirection } from "../../../notation";
import { Application } from "../../state/Application";

export const Stroke = (_application: Application, context: CanvasRenderingContext2D, element: layout.Stroke) => {
  context.fillStyle = "#000000";
  context.strokeStyle = "#000000";
  context.lineWidth = LINE_STROKE_WIDTH;

  switch (element.stroke.direction) {
    case StrokeDirection.Down: {
      context.fillRect(element.box.x, element.box.y, element.box.width, 0.5 * element.box.height);
      context.beginPath();
      context.moveTo(element.box.x, element.box.y);
      context.lineTo(element.box.x, element.box.bottom);
      context.moveTo(element.box.right, element.box.y);
      context.lineTo(element.box.right, element.box.bottom);
      context.stroke();
      context.closePath();
      break;
    }
    case StrokeDirection.Up: {
      const path = `
        M ${element.box.x} ${element.box.bottom}
        L ${element.box.centerX} 0
        L ${element.box.right} ${element.box.bottom}
      `;
      context.stroke(new Path2D(path));
      break;
    }
  }
};