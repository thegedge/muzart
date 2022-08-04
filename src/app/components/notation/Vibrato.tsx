import { range } from "lodash";
import React from "react";
import layout, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";

export function Vibrato(props: { node: layout.Vibrato }) {
  const startX = 0.5 * STAFF_LINE_HEIGHT;
  const startY = 0.6 * props.node.box.height;
  const amplitude = 0.3 * STAFF_LINE_HEIGHT;
  const wavelength = 0.3 * STAFF_LINE_HEIGHT;
  const numPeaks = Math.floor((props.node.box.width - 2 * startX) / wavelength / 2) * 2; // 2* startX for padding on the right
  const points = range(numPeaks - 1).map((_) => `${wavelength},0`);

  const path = `
    M ${startX},${startY}
    q ${0.5 * wavelength},-${amplitude} ${wavelength},0
    t ${points.join(" ")}
    l ${0.6 * wavelength},-${0.8 * wavelength}
    q -${0.5 * wavelength},${amplitude} -${wavelength},0
    t -${points.join(" -")}
  `;

  return (
    <BoxGroup node={props.node}>
      <path d={path} fill="#555555" stroke="#555555" strokeWidth={LINE_STROKE_WIDTH} />
    </BoxGroup>
  );
}
