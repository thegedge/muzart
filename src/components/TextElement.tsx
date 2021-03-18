import React from "react";
import { Text } from "../layout";

export function TextElement(props: { text: Text }) {
  let x = 0;
  let y = props.text.box.centerY;
  let anchor: string;
  switch (props.text.align) {
    case "center":
      x = props.text.box.right / 2;
      anchor = "middle";
      break;
    case "right":
      x = props.text.box.right;
      anchor = "end";
      break;
    case "left":
      x = props.text.box.x;
      anchor = "start";
      break;
  }

  return (
    <>
      {/* <rect {...svgBoxProps(props.text)} stroke="red" fill="none" strokeWidth={0.01} /> */}
      <text
        x={x}
        y={y}
        dominantBaseline="central"
        textAnchor={anchor}
        style={{ fontSize: props.text.size, ...props.text.style }}
      >
        {props.text.value}
      </text>
    </>
  );
}
