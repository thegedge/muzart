import layout, { LINE_STROKE_WIDTH } from "../layout";
import { Application } from "../ui/state/Application";
import { Text } from "./Text";

export const DashedLineText = (
  application: Application,
  context: CanvasRenderingContext2D,
  element: layout.DashedLineText
) => {
  Text(application, context, {
    box: element.box,
    size: element.size,
    text: element.text,
    halign: "start",
    valign: "center",
    style: { color: "#333333" },
  });

  // TODO need to have a better measurement of text instead of arbitrary multiplicative factor
  const textWidth = element.text.length * element.size * 0.6;

  if (textWidth < element.box.width) {
    context.strokeStyle = "#333333";

    context.beginPath();
    context.moveTo(element.box.x + Math.min(textWidth, element.box.width), element.box.centerY);
    context.lineTo(element.box.right, element.box.centerY);
    context.setLineDash([12 * LINE_STROKE_WIDTH, 4 * LINE_STROKE_WIDTH]);
    context.stroke();

    context.moveTo(element.box.right, element.box.centerY - 0.5 * element.size);
    context.lineTo(element.box.right, element.box.centerY + 0.5 * element.size);
    context.setLineDash([]);
    context.stroke();
    context.closePath();
  }
};
