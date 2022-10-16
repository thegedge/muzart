import types, { Box, chordWidth, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { StrokeDirection } from "../../notation";
import { LayoutElement } from "./LayoutElement";

export class Stroke extends LayoutElement<"Stroke", types.PageElement | types.LineElement> implements types.Stroke {
  readonly type = "Stroke";

  constructor(readonly stroke: notation.Stroke) {
    super(new Box(0, 0, chordWidth(1), STAFF_LINE_HEIGHT));
  }

  render(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#000000";
    context.strokeStyle = "#000000";
    context.lineWidth = LINE_STROKE_WIDTH;

    switch (this.stroke.direction) {
      case StrokeDirection.Down: {
        context.fillRect(this.box.x, this.box.y, this.box.width, 0.5 * this.box.height);
        context.beginPath();
        context.moveTo(this.box.x, this.box.y);
        context.lineTo(this.box.x, this.box.bottom);
        context.moveTo(this.box.right, this.box.y);
        context.lineTo(this.box.right, this.box.bottom);
        context.stroke();
        context.closePath();
        break;
      }
      case StrokeDirection.Up: {
        const path = `
        M ${this.box.x} ${this.box.bottom}
        L ${this.box.centerX} 0
        L ${this.box.right} ${this.box.bottom}
      `;
        context.stroke(new Path2D(path));
        break;
      }
    }
  }
}
