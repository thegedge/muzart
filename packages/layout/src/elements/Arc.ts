import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

type VerticalOrientation = "above" | "below";

export class Arc extends LayoutElement<"Arc"> {
  readonly type = "Arc";
  readonly orientation: VerticalOrientation;

  constructor(box: Box, orientation: VerticalOrientation = "below") {
    super(box);
    this.orientation = orientation;
  }
}
