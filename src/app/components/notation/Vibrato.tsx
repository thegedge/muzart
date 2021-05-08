import React from "react";
import * as layout from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import { svgSizeProps } from "../utils/svg";

export function Vibrato(props: { node: layout.Vibrato }) {
  return (
    <BoxGroup node={props.node}>
      <rect {...svgSizeProps(props.node.box)} fill="url(#vibrato)" />
    </BoxGroup>
  );
}
