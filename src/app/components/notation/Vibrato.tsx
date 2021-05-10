import React from "react";
import * as layout from "../../layout";
import { STAFF_LINE_HEIGHT } from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";

export function Vibrato(props: { node: layout.Vibrato }) {
  const y = (props.node.box.height - STAFF_LINE_HEIGHT) / 2;
  return (
    <BoxGroup node={props.node}>
      <rect x={0} y={y} width={props.node.box.width} height={STAFF_LINE_HEIGHT} fill="url(#vibrato)" />
    </BoxGroup>
  );
}
