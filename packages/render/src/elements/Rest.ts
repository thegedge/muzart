import * as layout from "@muzart/layout";
import { StringInstrument } from "@muzart/notation";
import { Rests } from "../resources/rests";
import { RenderFunc } from "../types";

export const Rest: RenderFunc<layout.Rest> = (element, render) => {
  const path = Rests[element.chord.value.name];
  if (!path) {
    return null;
  }

  // FIXME bring back AllElements so this is properly narrowed
  const parentPart = layout.getAncestorOfType(element, "Part");
  if (!(parentPart instanceof layout.Part)) {
    return null;
  }

  const instrument = parentPart.part.instrument;

  // TODO with a properly sized box, we should be able to place these without needing the selection.
  //   Also, once we have score notation, staff line count may differ from tab -> score, so this isn't right.
  let numStaffLines = 6;
  if (instrument instanceof StringInstrument) {
    numStaffLines = instrument.tuning.length;
  }

  const offset = (numStaffLines - 1) / 2;

  render.save();
  render.translate(element.box.x, element.box.y + layout.STAFF_LINE_HEIGHT * offset);
  render.scale(layout.STAFF_LINE_HEIGHT, layout.STAFF_LINE_HEIGHT);
  render.fill(new Path2D(path));
  render.restore();
};
