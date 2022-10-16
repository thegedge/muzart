import types, { BEAM_HEIGHT } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export const DOT_SIZE = 2 * BEAM_HEIGHT;

export class Dot extends LayoutElement<"Dot", types.LineElement> implements types.Dot {
  readonly type = "Dot";

  constructor(x: number, y: number) {
    super(new Box(x, y, DOT_SIZE, DOT_SIZE));
  }

  render(context: CanvasRenderingContext2D): void {
    const w = this.box.width;
    const h = this.box.height;
    context.fillStyle = "#000000";
    context.beginPath();
    context.ellipse(this.box.centerX, this.box.centerY, 0.25 * w, 0.25 * h, 0, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
  }
}
