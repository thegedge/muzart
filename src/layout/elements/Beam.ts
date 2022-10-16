import types from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

const BEAM_COLOR = "#333333";

export class Beam extends LayoutElement<"Beam", types.LineElement> implements types.Beam {
  readonly type = "Beam";
  readonly size: number;

  constructor(box: Box, size?: number) {
    super(box);
    this.size = size ?? box.height;
  }

  render(context: CanvasRenderingContext2D): void {
    context.fillStyle = BEAM_COLOR;

    if (this.size == this.box.height) {
      context.fillRect(this.box.x, this.box.y, this.box.width, this.box.height);
      return;
    }

    const x1 = this.box.x;
    const y1 = this.box.y;
    const x2 = this.box.right;
    const y2 = this.box.bottom;
    const sz = this.size;

    context.beginPath();
    context.moveTo(x1, y2);
    context.lineTo(x2, y1 + sz);
    context.lineTo(x2, y1);
    context.lineTo(x1, y2 - sz);
    context.fill();
    context.closePath();
  }
}
