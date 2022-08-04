import React from "react";
import layout from "../../layout";

export const BarLine = (props: { node: layout.BarLine }) => {
  return (
    <line
      x1={props.node.box.centerX}
      y1={props.node.box.y}
      x2={props.node.box.centerX}
      y2={props.node.box.bottom}
      stroke="#000000"
      strokeWidth={props.node.strokeSize}
    />
  );
};
