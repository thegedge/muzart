import React from "react";
import { Dot } from "../../layout";

export function Dot(props: { node: Dot }) {
  return (
    <ellipse
      cx={props.node.box.centerX}
      cy={props.node.box.centerY}
      rx={props.node.box.width / 4}
      ry={props.node.box.height / 4}
      fill="#000000"
    />
  );
}
