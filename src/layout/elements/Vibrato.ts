import types, { STAFF_LINE_HEIGHT } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Vibrato extends LayoutElement<"Vibrato", types.Chord> implements types.Vibrato {
  readonly type = "Vibrato";

  constructor() {
    super(new Box(0, 0, 0, STAFF_LINE_HEIGHT));
  }
}
