import React from "react";
import { HasBox } from "../../layout";
import { useDebugRectParams } from "../utils/DebugContext";
import { svgBoxProps, svgPositionTransform } from "../utils/svg";

export function BoxGroup(props: {
  node: HasBox & { type?: string };
  scale?: number;
  forceDebug?: boolean;
  children?: React.ReactNode;
}) {
  const debugParams = useDebugRectParams(props.node.type, props.forceDebug);
  const transforms = [svgPositionTransform(props.node)];
  if (props.scale) {
    transforms.push(`scale(${props.scale})`);
  }

  return (
    <>
      <g transform={transforms.join(" ")}>{props.children}</g>
      {debugParams && <rect {...svgBoxProps(props.node)} {...debugParams} />}
    </>
  );
}
