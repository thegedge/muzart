import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class Path extends LayoutElement<"Path"> {
  readonly type = "Path";
  readonly path: Path2D;

  constructor(box: Box, path: Path2D) {
    super(box);
    this.path = path;
  }
}
