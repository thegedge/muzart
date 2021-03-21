import React, { CSSProperties } from "react";
import Box from "../../layout/Box";
import { svgBoxProps } from "../utils/svg";

export function TextElement(props: {
  text: string;
  size: number;
  box: Box;
  align: "left" | "center" | "right";
  fill?: boolean;
  style?: CSSProperties;
}) {
  let x = 0;
  let y = props.box.centerY;
  let anchor: string;
  switch (props.align) {
    case "center":
      x = props.box.centerX;
      anchor = "middle";
      break;
    case "right":
      x = props.box.right;
      anchor = "end";
      break;
    case "left":
      x = props.box.x;
      anchor = "start";
      break;
  }

  return (
    <>
      {/* <rect {...svgBoxProps(props.box)} stroke="red" fill="none" strokeWidth={0.01} /> */}
      {props.fill && <rect {...svgBoxProps(props.box)} fill="white" />}
      <text x={x} y={y} dominantBaseline="central" textAnchor={anchor} style={{ fontSize: props.size, ...props.style }}>
        {props.text}
      </text>
    </>
  );
}
