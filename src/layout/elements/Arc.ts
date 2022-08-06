import types from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Arc extends LayoutElement<"Arc", types.LineElement> implements types.Arc {
  readonly type = "Arc";

  constructor(box: Box, readonly orientation: types.VerticalOrientation = "below") {
    super(box);
  }
}
