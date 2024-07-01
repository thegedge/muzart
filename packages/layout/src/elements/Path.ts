import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class Path extends LayoutElement<"Path"> {
  readonly type = "Path";

  constructor(
    box: Box,
    readonly path: Path2D,
  ) {
    super(box);
  }
}
