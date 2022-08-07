import React from "react";
import layout from "../../../layout";
import { svgBoxProps } from "../../utils/svg";

const BEAM_COLOR = "#333333";

export const Beam = (props: { node: layout.Beam }): JSX.Element => {
  const beam = props.node;
  if (beam.size == beam.box.height) {
    return <rect {...svgBoxProps(beam.box)} fill={BEAM_COLOR} />;
  }

  const x1 = beam.box.x;
  const y1 = beam.box.y;
  const x2 = beam.box.right;
  const y2 = beam.box.bottom;
  const sz = beam.size;

  return <polyline points={`${x1},${y2} ${x2},${y1 + sz} ${x2},${y1} ${x1},${y2 - sz}`} fill={BEAM_COLOR} />;
};
