import layout from "../../../layout";

export const BarLine = (context: CanvasRenderingContext2D, element: layout.BarLine) => {
  context.strokeStyle = `${element.strokeSize} #000000`;
  context.beginPath();
  context.moveTo(element.box.centerX, element.box.y);
  context.lineTo(element.box.centerX, element.box.bottom);
  context.stroke();
  context.closePath();
};
