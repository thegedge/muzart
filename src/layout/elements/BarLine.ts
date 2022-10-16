import types from "..";
import { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../constants";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class BarLine extends LayoutElement<"BarLine", types.LineElement> implements types.BarLine {
  readonly type = "BarLine";

  constructor(numStaffLines: number, readonly strokeSize = LINE_STROKE_WIDTH) {
    super(new Box(0, 0, strokeSize, (numStaffLines - 1) * STAFF_LINE_HEIGHT));
  }

  render(context: CanvasRenderingContext2D): void {
    context.lineWidth = LINE_STROKE_WIDTH;
    context.strokeStyle = "#000000";
    context.beginPath();
    context.moveTo(this.box.x, this.box.y);
    context.lineTo(this.box.right, this.box.bottom);
    context.stroke();
    context.closePath();
  }
}
