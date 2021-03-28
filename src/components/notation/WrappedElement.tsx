import React from "react";
import { LineElement, Wrapped } from "../../layout";
import { svgPositionTransform } from "../utils/svg";
import LineElementComponent from "./LineElement";

export function WrappedElement(props: { node: Wrapped<LineElement> }) {
  return (
    <g transform={svgPositionTransform(props.node)}>
      <LineElementComponent element={props.node.element} />
    </g>
  );
}
