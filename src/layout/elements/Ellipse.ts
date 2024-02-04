import types from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Ellipse extends LayoutElement<"Ellipse", types.PageElement | types.LineElement> implements types.Ellipse {
  readonly type = "Ellipse";

  static circle(cx: number, cy: number, r: number) {
    return new Ellipse(new Box(cx - r, cy - r, 2 * r, 2 * r));
  }
}
