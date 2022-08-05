import React from "react";
import * as layout from "../../../layout";
import { STAFF_LINE_HEIGHT } from "../../../layout";
import { Icons } from "../../resources/rests";
import { SelectableBoxGroup } from "../layout/SelectableBoxGroup";

const REST_COLOR = "#333333";

export const Rest = (props: { node: layout.Rest }) => {
  const icon = Icons[props.node.chord.value.name];
  if (!icon) {
    return null;
  }

  return (
    <SelectableBoxGroup node={props.node} scale={STAFF_LINE_HEIGHT}>
      {/* TODO maybe a nicer way to position rests? */}
      <g transform={`translate(0, 2.5)`}>{React.cloneElement(icon, { fill: REST_COLOR })}</g>
    </SelectableBoxGroup>
  );
};
