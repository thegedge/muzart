import types from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Slide extends LayoutElement<"Slide", types.LineElement> implements types.Slide {
  readonly type = "Slide";

  constructor(
    box: Box,
    readonly upwards: boolean,
  ) {
    super(box);
  }
}
