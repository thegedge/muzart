import types from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Space extends LayoutElement<"Space", types.LineElement | types.PageElement> implements types.Space {
  static fromDimensions(width: number, height: number) {
    return new Space(new Box(0, 0, width, height));
  }

  readonly type = "Space";

  render(_context: CanvasRenderingContext2D): void {
    // Nothing to do
  }
}
