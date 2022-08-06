import types from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Beam extends LayoutElement<"Beam", types.LineElement> implements types.Beam {
  readonly type = "Beam";
  readonly size: number;

  constructor(box: Box, size?: number) {
    super(box);
    this.size = size ?? box.height;
  }
}
