import { omit } from "lodash";
import { JSX } from "preact";
import React from "react";
import { LayoutElement } from "../../../layout";
import { svgPositionTransform } from "../../utils/svg";
import { DebugBox } from "./DebugBox";

export interface BoxGroupProps extends Omit<JSX.SVGAttributes<SVGGElement>, "clip" | "onClick"> {
  element: LayoutElement;
  scale?: number;
  forceDebug?: boolean;
  hidden?: boolean;
  clip?: boolean;

  // We need this one here because the onClick from SVGAttributes has `this: never`, which makes it impossible to call
  onClick?: (event: MouseEvent) => void;
}

export const BoxGroup = (props: BoxGroupProps) => {
  if (props.hidden) {
    return null;
  }

  const transforms = [svgPositionTransform(props.element)];
  if (props.scale) {
    transforms.push(`scale(${props.scale})`);
  }

  let clipProps: JSX.SVGAttributes<SVGGElement> = {};
  if (props.clip) {
    const cx = 0;
    const cy = 0;
    const cr = props.element.box.width;
    const cb = props.element.box.height;
    clipProps = {
      clipPath: `polygon(${cx} ${cy}, ${cr} ${cy}, ${cr} ${cb}, ${cx} ${cb}) view-box`,
      clipPathUnits: "userSpaceOnUse",
    };
  }

  return (
    <g
      transform={transforms.join(" ")}
      {...omit(props, "element", "children", "scale", "forceDebug", "hidden", "clip")}
      data-element-type={props.element.type}
      {...clipProps}
    >
      {props.children}
      <DebugBox box={props.element.box} debugType={props.element.type} />
    </g>
  );
};
