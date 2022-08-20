import React, { CSSProperties, JSX } from "react";
import { Alignment } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { svgBoxProps } from "../../utils/svg";
import { DebugBox } from "../layout/DebugBox";

export const TextElement = (props: {
  text: string;
  size: number;
  box: Box;
  halign?: Alignment;
  valign?: Alignment;
  fill?: boolean | string;
  style?: CSSProperties;
}) => {
  let x;
  let textAnchor: JSX.SVGAttributes["textAnchor"];
  switch (props.halign || "start") {
    case "start":
      x = props.box.x;
      textAnchor = "start";
      break;
    case "center":
      x = props.box.centerX;
      textAnchor = "middle";
      break;
    case "end":
      x = props.box.right;
      textAnchor = "end";
      break;
  }

  let y;
  let dominantBaseline: JSX.SVGAttributes["dominantBaseline"];
  switch (props.valign || "start") {
    case "start":
      y = props.box.y;
      dominantBaseline = "hanging";
      break;
    case "center":
      y = props.box.centerY;
      dominantBaseline = "central";
      break;
    case "end":
      y = props.box.bottom;
      dominantBaseline = "text-top";
      break;
  }

  return (
    <>
      <DebugBox box={props.box} debugType="TextElement" />
      {props.fill && <rect {...svgBoxProps(props.box)} fill={props.fill === true ? "#ffffff" : props.fill} />}
      <text
        x={x}
        y={y}
        dominantBaseline={dominantBaseline}
        textAnchor={textAnchor}
        style={{ fontSize: props.size, ...props.style }}
      >
        {props.text}
      </text>
    </>
  );
};
