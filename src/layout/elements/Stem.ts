import types from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Stem extends LayoutElement<"Stem", types.PageElement | types.LineElement> implements types.Stem {
  readonly type = "Stem";

  constructor(box: Box) {
    super(box);
  }
}
