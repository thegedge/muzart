import { omit } from "lodash";
import { JSX } from "preact";
import React from "react";
import { LayoutElement } from "../../../layout";
import { svgPositionTransform } from "../../utils/svg";
import { DebugBox } from "./DebugBox";

export interface BoxGroupProps extends JSX.SVGAttributes<SVGGElement> {
  node: LayoutElement;
  scale?: number;
  forceDebug?: boolean;
  hidden?: boolean;
  onClick?: (event: MouseEvent) => void;
}

export const BoxGroup = (props: BoxGroupProps) => {
  if (props.hidden) {
    return null;
  }

  const transforms = [svgPositionTransform(props.node)];
  if (props.scale) {
    transforms.push(`scale(${props.scale})`);
  }

  // TODO Maybe a clip-path (possibly on/off debug mode) to hide any overflow
  return (
    <g
      transform={transforms.join(" ")}
      {...omit(props, "node", "children", "scale", "forceDebug", "hidden")}
      data-node-type={props.node.type}
    >
      {props.children}
      <DebugBox box={props.node.box} debugType={props.node.type} />
    </g>
  );
};
