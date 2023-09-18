import layout, { STAFF_LINE_HEIGHT } from "../layout";
import { Rests } from "../ui/resources/rests";
import { RenderFunc } from "./types";

export const Rest: RenderFunc<layout.Rest> = (element, render, { application }) => {
  const path = Rests[element.chord.value.name];
  if (!path) {
    return null;
  }

  // TODO with a properly sized box, we should be able to place these without needing the selection
  const offset = ((application.selection.part?.part?.instrument?.tuning?.length ?? 6) - 1) / 2;

  render.save();
  render.translate(element.box.x, element.box.y + STAFF_LINE_HEIGHT * offset);
  render.scale(STAFF_LINE_HEIGHT, STAFF_LINE_HEIGHT);
  render.fill(new Path2D(path));
  render.restore();
};
