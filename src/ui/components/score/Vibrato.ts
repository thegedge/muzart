import { range } from "lodash";
import layout, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../../layout";

export const Vibrato = (context: CanvasRenderingContext2D, element: layout.Vibrato) => {
  const startX = element.box.x + 0.2 * STAFF_LINE_HEIGHT;
  const startY = element.box.y + 0.6 * element.box.height;
  const amplitude = 0.3 * STAFF_LINE_HEIGHT;
  const wavelength = 0.3 * STAFF_LINE_HEIGHT;
  const numPeaks = Math.floor((element.box.right - 2 * startX) / wavelength / 2) * 2; // 2* startX for padding on the right
  const points = range(numPeaks - 1).map((_) => `${wavelength},0`);

  const path = new Path2D(`
    M ${startX},${startY}
    q ${0.5 * wavelength},-${amplitude} ${wavelength},0
    t ${points.join(" ")}
    l ${0.6 * wavelength},-${0.8 * wavelength}
    q -${0.5 * wavelength},${amplitude} -${wavelength},0
    t -${points.join(" -")}
  `);

  context.fillStyle = "#555555";
  context.strokeStyle = `${LINE_STROKE_WIDTH} #555555`;
  context.stroke(path);
  context.fill(path);
};
