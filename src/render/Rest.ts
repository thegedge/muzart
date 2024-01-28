import { Rests } from "../editor/resources/rests";
import layout, { STAFF_LINE_HEIGHT } from "../layout";
import { StringInstrument } from "../notation";
import { RenderFunc } from "./types";

export const Rest: RenderFunc<layout.Rest> = (element, render, { application }) => {
  const path = Rests[element.chord.value.name];
  if (!path) {
    return null;
  }

  const instrument = application.selection.part?.part?.instrument;

  // TODO with a properly sized box, we should be able to place these without needing the selection.
  //   Also, once we have score notation, staff line count may differ from tab -> score, so this isn't right.
  let numStaffLines = 6;
  if (instrument instanceof StringInstrument) {
    numStaffLines = instrument.tuning.length;
  }

  const offset = (numStaffLines - 1) / 2;

  render.save();
  render.translate(element.box.x, element.box.y + STAFF_LINE_HEIGHT * offset);
  render.scale(STAFF_LINE_HEIGHT, STAFF_LINE_HEIGHT);
  render.fill(new Path2D(path));
  render.restore();
};
