import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class Space extends LayoutElement<"Space"> {
  static fromDimensions(width: number, height: number) {
    return new Space(new Box(0, 0, width, height));
  }

  readonly type = "Space";
}
