import React from "react";
import { LineElement, Wrapped } from "../../layout";
import { svgPositionTransform } from "../utils/svg";
import ScoreElement from "./ScoreElement";

export function WrappedElement(props: { node: Wrapped<LineElement> }) {
  return (
    <g transform={svgPositionTransform(props.node)}>
      <ScoreElement element={props.node.element} />
    </g>
  );
}
