import type types from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Path extends LayoutElement<"Path", types.PageLine | types.ChordDiagram> implements types.Path {
  readonly type = "Path";

  constructor(
    box: Box,
    readonly path: Path2D,
  ) {
    super(box);
  }
}
