import types, { LINE_STROKE_WIDTH } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Arc extends LayoutElement<"Arc", types.LineElement> implements types.Arc {
  readonly type = "Arc";

  constructor(box: Box, readonly orientation: types.VerticalOrientation = "below") {
    super(box);
  }

  render(context: CanvasRenderingContext2D) {
    const l = this.box.x;
    const t = this.box.y;
    const r = this.box.right;
    const b = this.box.bottom;
    const w = this.box.width;
    const offset = 3 * LINE_STROKE_WIDTH;

    context.lineCap = "round";
    context.fillStyle = "#555555";
    context.beginPath();

    switch (this.orientation) {
      case "above":
        context.moveTo(l, b);
        context.bezierCurveTo(l + w * 0.3, t, l + w * 0.7, t, r, b);
        context.bezierCurveTo(l + w * 0.7, t + offset, l + w * 0.3, t + offset, l, b);
        break;
      case "below":
        context.moveTo(l, t);
        context.bezierCurveTo(l + w * 0.3, b, l + w * 0.7, b, r, t);
        context.bezierCurveTo(l + w * 0.7, b - offset, l + w * 0.3, b - offset, l, t);
        break;
    }

    context.fill();
    context.closePath();
  }
}
