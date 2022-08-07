import types, { STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Bend extends LayoutElement<"Bend", types.LineElement> implements types.Bend {
  readonly type = "Bend";
  readonly descent: number;

  constructor(readonly bend: notation.Bend, note: notation.Note) {
    super(new Box(0, 0, 0, 2.5 * STAFF_LINE_HEIGHT));
    this.descent = ((note.placement?.string || 1) - 0.5) * STAFF_LINE_HEIGHT;
  }
}
