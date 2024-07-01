import * as layout from "@muzart/layout";
import { range } from "lodash-es";
import { RenderFunc } from "../types";

export const Vibrato: RenderFunc<layout.Vibrato> = (element, render) => {
  const paddingX = 0.2 * layout.STAFF_LINE_HEIGHT;
  const startX = element.box.x + paddingX;
  const startY = element.box.y + 0.6 * element.box.height;
  const amplitude = 0.3 * layout.STAFF_LINE_HEIGHT;
  const wavelength = 0.3 * layout.STAFF_LINE_HEIGHT;
  const numPeaks = Math.floor((element.box.width - 2 * paddingX) / wavelength / 2) * 2; // 2* startX for padding on the right
  const points = range(numPeaks - 1).map((_) => `${wavelength},0`);

  const path = new Path2D(`
    M ${startX},${startY}
    q ${0.5 * wavelength},-${amplitude} ${wavelength},0
    t ${points.join(" ")}
    l ${0.6 * wavelength},-${0.8 * wavelength}
    q -${0.5 * wavelength},${amplitude} -${wavelength},0
    t -${points.join(" -")}
    L ${startX},${startY}
  `);

  render.stroke(path);
  render.fill(path);
};
