import React from "react";
import { Beam } from "../../layout";
import { svgBoxProps } from "../utils/svg";

const STEM_BEAM_COLOR = "#333333";

export function Beam(props: { node: Beam }) {
  // Need to do this stroke weirdness because Firefox otherwise draws a stroke?!
  return <rect {...svgBoxProps(props.node.box)} fill={STEM_BEAM_COLOR} stroke="black" strokeWidth={0} />;
}
