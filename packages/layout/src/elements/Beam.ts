import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class Beam extends LayoutElement<"Beam"> {
  readonly type = "Beam";
  readonly size: number;

  constructor(box: Box, size?: number) {
    super(box);
    this.size = size ?? box.height;
  }
}
