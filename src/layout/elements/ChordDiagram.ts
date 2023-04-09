import types, { STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class ChordDiagram extends LayoutElement<"ChordDiagram", types.LineElement> implements types.ChordDiagram {
  readonly type = "ChordDiagram";
  readonly textSize = 1.25 * STAFF_LINE_HEIGHT;

  constructor(readonly diagram: notation.ChordDiagram) {
    super(new Box(0, 0, 4 * STAFF_LINE_HEIGHT, (diagram ? 7 : 1) * STAFF_LINE_HEIGHT));
  }
}
