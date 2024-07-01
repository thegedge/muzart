import { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../constants";
import { Box } from "../utils/Box";
import { LayoutElement } from "./LayoutElement";

export class BarLine extends LayoutElement<"BarLine"> {
  readonly type = "BarLine";

  constructor(
    numStaffLines: number,
    readonly strokeSize = LINE_STROKE_WIDTH,
  ) {
    super(new Box(0, 0, strokeSize, (numStaffLines - 1) * STAFF_LINE_HEIGHT));
  }
}
