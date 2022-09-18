import * as layout from "../../../layout";
import { STAFF_LINE_HEIGHT } from "../../../layout";
import { Rests } from "../../resources/rests";
import { Application } from "../../state/Application";

const REST_COLOR = "#333333";

export const Rest = (application: Application, context: CanvasRenderingContext2D, element: layout.Rest) => {
  const path = Rests[element.chord.value.name];
  if (!path) {
    return null;
  }

  // TODO with a properly sized box, we should be able to place these without needing the selection
  const offset = ((application.selection.part?.part?.instrument?.tuning?.length ?? 6) - 1) / 2;

  context.save();
  context.translate(element.box.x, element.box.y + STAFF_LINE_HEIGHT * offset);
  context.scale(STAFF_LINE_HEIGHT, STAFF_LINE_HEIGHT);
  context.fillStyle = REST_COLOR;
  context.fill(new Path2D(path));
  context.restore();
};
