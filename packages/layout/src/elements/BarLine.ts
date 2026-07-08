import { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../constants";
import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class BarLine extends LayoutElement<"BarLine"> {
  readonly type = "BarLine";
  readonly strokeSize: number;

  constructor(numStaffLines: number, strokeSize = LINE_STROKE_WIDTH) {
    super(new Box(0, 0, strokeSize, (numStaffLines - 1) * STAFF_LINE_HEIGHT));
    this.strokeSize = strokeSize;
  }
}
