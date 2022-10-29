import layout, { LINE_STROKE_WIDTH } from "../layout";
import { Application } from "../ui/state/Application";
import { Text } from "./Text";

export const Note = (application: Application, context: CanvasRenderingContext2D, element: layout.Note) => {
  if (element.note.tie && element.note.tie.type !== "start") {
    return;
  }

  const text = element.note.toString();
  if (text.length === 0) {
    return;
  }

  context.fillStyle = "#FFFFFF";
  context.fillRect(
    element.box.x,
    element.box.centerY - 2 * LINE_STROKE_WIDTH,
    element.box.width,
    4 * LINE_STROKE_WIDTH
  );

  Text(application, context, {
    box: element.box,
    halign: "center",
    valign: "center",
    size: element.box.height,
    text,
  });
};
