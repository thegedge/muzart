import types, { STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class ChordDiagram extends LayoutElement<"ChordDiagram", types.LineElement> implements types.ChordDiagram {
  readonly type = "ChordDiagram";

  constructor(readonly diagram: notation.ChordDiagram) {
    const height = (diagram ? 7 : 1) * STAFF_LINE_HEIGHT;

    // TODO default width, ignoring its placement in the above staff layout
    super(new Box(0, 0, 0, height));
  }
}
