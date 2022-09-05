import React from "react";
import layout from "../../../layout";

export const BarLine = (props: { element: layout.BarLine }) => {
  return (
    <line
      x1={props.element.box.centerX}
      y1={props.element.box.y}
      x2={props.element.box.centerX}
      y2={props.element.box.bottom}
      stroke="#000000"
      strokeWidth={props.element.strokeSize}
    />
  );
};
