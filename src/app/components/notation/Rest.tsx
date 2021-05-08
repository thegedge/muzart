import React from "react";
import * as layout from "../../layout";
import { STAFF_LINE_HEIGHT } from "../../layout";
import { Icons } from "../icons/rests";
import { BoxGroup } from "../layout/BoxGroup";

const REST_COLOR = "#333333";

export function Rest(props: { node: layout.Rest }) {
  return (
    <BoxGroup node={props.node} scale={STAFF_LINE_HEIGHT}>
      {/* TODO maybe a nicer way to position rests? */}
      <g transform={`translate(0, 2.5)`}>
        {React.cloneElement(Icons[props.node.chord.value.name], { fill: REST_COLOR })}
      </g>
    </BoxGroup>
  );
}
