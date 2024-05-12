import types, { Box, chordWidth, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { LayoutElement } from "./LayoutElement";

export class Stroke extends LayoutElement<"Stroke", types.LineElement> implements types.Stroke {
  readonly type = "Stroke";

  constructor(readonly stroke: notation.Stroke) {
    super(new Box(0, 0, chordWidth(1), STAFF_LINE_HEIGHT));
  }
}
