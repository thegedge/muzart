import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

type VerticalOrientation = "above" | "below";

export class Arc extends LayoutElement<"Arc"> {
  readonly type = "Arc";

  constructor(
    box: Box,
    readonly orientation: VerticalOrientation = "below",
  ) {
    super(box);
  }
}
