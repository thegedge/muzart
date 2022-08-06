import types from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Line extends LayoutElement<"Line", types.PageElement | types.LineElement> implements types.Line {
  readonly type = "Line";

  constructor(box: Box, readonly color: string) {
    super(box);
  }
}
