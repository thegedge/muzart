import { range } from "lodash";
import types, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "..";
import { Box } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Vibrato extends LayoutElement<"Vibrato", types.Chord> implements types.Vibrato {
  readonly type = "Vibrato";

  constructor() {
    super(new Box(0, 0, 0, STAFF_LINE_HEIGHT));
  }

  render(context: CanvasRenderingContext2D): void {
    const startX = this.box.x + 0.2 * STAFF_LINE_HEIGHT;
    const startY = this.box.y + 0.6 * this.box.height;
    const amplitude = 0.3 * STAFF_LINE_HEIGHT;
    const wavelength = 0.3 * STAFF_LINE_HEIGHT;
    const numPeaks = Math.floor((this.box.right - 2 * startX) / wavelength / 2) * 2; // 2* startX for padding on the right
    const points = range(numPeaks - 1).map((_) => `${wavelength},0`);

    const path = new Path2D(`
      M ${startX},${startY}
      q ${0.5 * wavelength},-${amplitude} ${wavelength},0
      t ${points.join(" ")}
      l ${0.6 * wavelength},-${0.8 * wavelength}
      q -${0.5 * wavelength},${amplitude} -${wavelength},0
      t -${points.join(" -")}
    `);

    context.lineWidth = LINE_STROKE_WIDTH;
    context.fillStyle = "#555555";
    context.strokeStyle = "#555555";
    context.stroke(path);
    context.fill(path);
  }
}
