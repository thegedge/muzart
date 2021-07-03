import { omit } from "lodash";
import React, { SVGProps } from "react";
import { LayoutElement } from "../../layout";
import { useDebugRectParams } from "../utils/DebugContext";
import { svgBoxProps, svgPositionTransform } from "../utils/svg";

export interface BoxGroupProps extends SVGProps<SVGGElement> {
  node: LayoutElement;
  scale?: number;
  forceDebug?: boolean;
}

export function BoxGroup(props: BoxGroupProps) {
  const debugParams = useDebugRectParams(props.node.type, props.forceDebug);
  const transforms = [svgPositionTransform(props.node)];
  if (props.scale) {
    transforms.push(`scale(${props.scale})`);
  }

  return (
    <>
      <g transform={transforms.join(" ")} {...omit(props, "node", "scale", "forceDebug")} />
      {debugParams && <rect {...svgBoxProps(props.node)} {...debugParams} />}
    </>
  );
}
