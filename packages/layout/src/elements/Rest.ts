import * as notation from "@muzart/notation";
import { chordWidth, STAFF_LINE_HEIGHT } from "..";
import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class Rest extends LayoutElement<"Rest"> {
  readonly type = "Rest";
  readonly chord: notation.Chord;

  constructor(chord: notation.Chord, staffLineCount: number) {
    super(new Box(0, 0, chordWidth(4), staffLineCount * STAFF_LINE_HEIGHT));
    this.chord = chord;
  }
}
