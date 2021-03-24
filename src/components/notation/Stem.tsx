import React from "react";
import { LINE_STROKE_WIDTH, Stem } from "../../layout";

const STEM_BEAM_COLOR = "#333333";

export function Stem(props: { node: Stem }) {
  return (
    <line
      x1={props.node.box.x}
      y1={props.node.box.y}
      x2={props.node.box.x}
      y2={props.node.box.bottom}
      stroke={STEM_BEAM_COLOR}
      strokeWidth={LINE_STROKE_WIDTH}
    />
  );
}
