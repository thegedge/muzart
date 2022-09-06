import * as layout from "../../../layout";
import { STAFF_LINE_HEIGHT } from "../../../layout";
import { Rests } from "../../resources/rests";

const REST_COLOR = "#333333";

export const Rest = (context: CanvasRenderingContext2D, element: layout.Rest) => {
  const path = Rests[element.chord.value.name];
  if (!path) {
    return null;
  }

  // TODO with a properly sized box, we should be able to place these without needing the selection
  // const { selection } = useApplicationState();
  // const offset = ((selection.part?.part.instrument?.tuning?.length ?? 6) - 1) / 2;
  const offset = (6 - 1) / 2;

  context.save();
  context.translate(element.box.x, element.box.y + STAFF_LINE_HEIGHT * offset);
  context.scale(STAFF_LINE_HEIGHT, STAFF_LINE_HEIGHT);
  context.fillStyle = REST_COLOR;
  context.fill(new Path2D(path));
  context.restore();
};
