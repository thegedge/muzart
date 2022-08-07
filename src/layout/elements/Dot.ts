import types, { DOT_SIZE } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Dot extends LayoutElement<"Dot", types.LineElement> implements types.Dot {
  readonly type = "Dot";

  constructor(x: number, y: number) {
    super(new Box(x, y, DOT_SIZE, DOT_SIZE));
  }
}
