import * as notation from "@muzart/notation";
import { chordWidth, STAFF_LINE_HEIGHT } from "../constants";
import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class Stroke extends LayoutElement<"Stroke"> {
  readonly type = "Stroke";
  readonly stroke: notation.Stroke;

  constructor(stroke: notation.Stroke) {
    super(new Box(0, 0, chordWidth(1), STAFF_LINE_HEIGHT));
    this.stroke = stroke;
  }
}
