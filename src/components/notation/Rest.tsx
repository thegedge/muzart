import React from "react";
import * as layout from "../../layout";
import { Icons } from "../icons/rests";
import { BoxGroup } from "../layout/BoxGroup";

const REST_COLOR = "#333333";

export function Rest(props: { node: layout.Rest }) {
  // TODO this scale is one staff line height, find a way to better propagate it
  const scale = props.node.box.height / 3.5;
  return (
    <BoxGroup node={props.node} scale={scale}>
      <g transform={`translate(${props.node.box.width / 2})`}>
        {React.cloneElement(Icons[props.node.chord.value.name], { fill: REST_COLOR })}
      </g>
    </BoxGroup>
  );
}
