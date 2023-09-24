import types from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Path extends LayoutElement<"Path", types.PageElement | types.LineElement> implements types.Path {
  readonly type = "Path";

  constructor(
    box: Box,
    readonly path: Path2D,
  ) {
    super(box);
  }
}
