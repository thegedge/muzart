import types, { chordWidth } from "..";
import * as notation from "../../notation";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Rest extends LayoutElement<"Rest", types.LineElement> implements types.Rest {
  readonly type = "Rest";

  constructor(readonly chord: notation.Chord, staffHeight: number) {
    super(new Box(0, 0, chordWidth(4), staffHeight));
  }
}
