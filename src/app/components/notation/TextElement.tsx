import React, { CSSProperties } from "react";
import { Alignment } from "../../layout";
import Box from "../../layout/utils/Box";
import { useDebugRectParams } from "../utils/DebugContext";
import { svgBoxProps } from "../utils/svg";

export function TextElement(props: {
  text: string;
  size: number;
  box: Box;
  halign?: Alignment;
  valign?: Alignment;
  fill?: boolean | string;
  style?: CSSProperties;
}) {
  let x;
  switch (props.halign || "start") {
    case "start":
      x = props.box.x;
      break;
    case "middle":
      x = props.box.centerX;
      break;
    case "end":
      x = props.box.right;
      break;
  }

  let dominantBaseline;
  let y;
  switch (props.valign || "start") {
    case "start":
      y = props.box.y;
      dominantBaseline = "hanging";
      break;
    case "middle":
      y = props.box.centerY;
      dominantBaseline = "central";
      break;
    case "end":
      y = props.box.bottom;
      dominantBaseline = "text-top";
      break;
  }

  const debugParams = useDebugRectParams("TextElement");
  return (
    <>
      {debugParams && <rect {...svgBoxProps(props.box)} {...debugParams} />}
      {props.fill && <rect {...svgBoxProps(props.box)} fill={props.fill === true ? "#ffffff" : props.fill} />}
      <text
        x={x}
        y={y}
        dominantBaseline={dominantBaseline}
        textAnchor={props.halign}
        style={{ fontSize: props.size, ...props.style }}
      >
        {props.text}
      </text>
    </>
  );
}
