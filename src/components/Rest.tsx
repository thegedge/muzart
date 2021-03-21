import React from "react";
import * as layout from "../layout";
import { BoxGroup } from "./BoxGroup";
import { Icons } from "./icons/rests";

const REST_COLOR = "#333333";

export function Rest(props: { node: layout.Rest }) {
  // TODO this scale is one staff line height, find a way to better propagate it
  const scale = props.node.box.height / 3.5;
  return (
    <BoxGroup node={props.node} scale={scale}>
      <g transform={`translate(${props.node.box.width / 2})`}>
        {React.cloneElement(Icons[props.node.chord.duration.base], { fill: REST_COLOR })}
      </g>
    </BoxGroup>
  );
}
