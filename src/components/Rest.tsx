import React from "react";
import * as layout from "../layout";
import { BoxGroup } from "./BoxGroup";
import { Icons } from "./icons/rests";

export function Rest(props: { node: layout.Rest }) {
  // TODO this scale is one staff line height, find a way to better propagate it
  const scale = props.node.box.height / 3.5;
  return (
    <BoxGroup node={props.node}>
      <g transform={`scale(${scale})`}>{Icons[props.node.chord.duration.base]}</g>
    </BoxGroup>
  );
}
