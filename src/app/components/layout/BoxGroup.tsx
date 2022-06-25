import { omit } from "lodash";
import React, { SVGProps } from "react";
import { LayoutElement } from "../../layout";
import { svgPositionTransform } from "../utils/svg";
import { DebugBox } from "./DebugBox";

export interface BoxGroupProps extends SVGProps<SVGGElement> {
  node: LayoutElement;
  scale?: number;
  forceDebug?: boolean;
}

export function BoxGroup(props: BoxGroupProps) {
  const transforms = [svgPositionTransform(props.node)];
  if (props.scale) {
    transforms.push(`scale(${props.scale})`);
  }

  return (
    <>
      <g transform={transforms.join(" ")} {...omit(props, "node", "scale", "forceDebug")} />
      <DebugBox box={props.node.box} debugType={props.node.type} />
    </>
  );
}
