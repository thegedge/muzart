import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class Line extends LayoutElement<"Line"> {
  readonly type = "Line";

  static vertical(y1: number, y2: number, x: number) {
    return new Line(new Box(x, y1, 0, y2 - y1));
  }

  static horizontal(x1: number, x2: number, y: number) {
    return new Line(new Box(x1, y, x2 - x1, 0));
  }
}
