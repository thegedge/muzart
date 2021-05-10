import React from "react";
import { LINE_STROKE_WIDTH, Slide } from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";

export function Slide(props: { node: Slide }) {
  return (
    <BoxGroup node={props.node}>
      <line
        x1={0}
        y1={props.node.upwards ? props.node.box.height : 0}
        x2={props.node.box.width}
        y2={props.node.upwards ? 0 : props.node.box.height}
        stroke="#000000"
        strokeWidth={2 * LINE_STROKE_WIDTH}
      />
    </BoxGroup>
  );
}
