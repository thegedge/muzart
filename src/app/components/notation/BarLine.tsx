import React from "react";
import * as layout from "../../layout";

export function BarLine(props: { node: layout.BarLine }) {
  return (
    <line
      x1={props.node.box.centerX}
      y1={props.node.box.y}
      x2={props.node.box.centerX}
      y2={props.node.box.bottom}
      stroke="black"
      strokeWidth={props.node.strokeSize}
    />
  );
}
