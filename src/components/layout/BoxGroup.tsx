import React from "react";
import { HasBox } from "../../layout";
import { useDebugColorFor } from "../utils/DebugContext";
import { svgPositionTransform, svgSizeProps } from "../utils/svg";

export function BoxGroup(props: { node: HasBox & { type?: string }; scale?: number; children: React.ReactNode }) {
  const debugColor = useDebugColorFor(props.node.type);
  const transforms = [svgPositionTransform(props.node)];
  if (props.scale) {
    transforms.push(`scale(${props.scale})`);
  }

  return (
    <g transform={transforms.join(" ")}>
      {props.children}
      {debugColor && <rect {...svgSizeProps(props.node)} fill="none" stroke={debugColor} strokeWidth={0.01} />}
    </g>
  );
}
