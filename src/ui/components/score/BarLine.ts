import layout from "../../../layout";
import { Application } from "../../state/Application";

export const BarLine = (_application: Application, context: CanvasRenderingContext2D, element: layout.BarLine) => {
  context.lineWidth = element.strokeSize;
  context.strokeStyle = "#000000";
  context.beginPath();
  context.moveTo(element.box.centerX, element.box.y);
  context.lineTo(element.box.centerX, element.box.bottom);
  context.stroke();
  context.closePath();
};
