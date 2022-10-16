import types, { LINE_STROKE_WIDTH } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Line extends LayoutElement<"Line", types.PageElement | types.LineElement> implements types.Line {
  readonly type = "Line";

  constructor(box: Box, readonly color: string) {
    super(box);
  }

  render(context: CanvasRenderingContext2D) {
    context.lineWidth = LINE_STROKE_WIDTH;
    context.strokeStyle = this.color;
    context.beginPath();
    context.moveTo(this.box.x, this.box.y);
    context.lineTo(this.box.right, this.box.bottom);
    context.stroke();
    context.closePath();
  }
}
