import types, { BEAM_HEIGHT } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export const DOT_SIZE = 2 * BEAM_HEIGHT;

export class Dot extends LayoutElement<"Dot", types.LineElement> implements types.Dot {
  readonly type = "Dot";

  constructor(x: number, y: number) {
    super(new Box(x, y, DOT_SIZE, DOT_SIZE));
  }
}
