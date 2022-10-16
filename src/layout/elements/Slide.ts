import types, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "..";
import { Box } from "../utils";
import { Arc } from "./Arc";
import { LayoutElement } from "./LayoutElement";

export class Slide extends LayoutElement<"Slide", types.LineElement> implements types.Slide {
  readonly type = "Slide";

  constructor(box: Box, readonly upwards: boolean) {
    super(box);
  }

  render(context: CanvasRenderingContext2D): void {
    context.strokeStyle = "#555555";
    context.lineWidth = 1.5 * LINE_STROKE_WIDTH;

    context.beginPath();
    if (this.upwards) {
      context.moveTo(this.box.x, this.box.y);
      context.lineTo(this.box.right, this.box.bottom);
    } else {
      context.moveTo(this.box.x + 5 * LINE_STROKE_WIDTH, this.box.bottom);
      context.lineTo(this.box.right - 5 * LINE_STROKE_WIDTH, this.box.y);
    }
    context.stroke();
    context.closePath();

    const arc = new Arc(
      new Box(
        this.box.x - 0.5 * STAFF_LINE_HEIGHT,
        this.box.y - STAFF_LINE_HEIGHT,
        this.box.width + STAFF_LINE_HEIGHT,
        0.8 * STAFF_LINE_HEIGHT
      ),
      "above"
    );
    arc.parent = this;
    arc.render(context);
  }
}
