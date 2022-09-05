import React, { JSX } from "react";
import layout, { LINE_STROKE_WIDTH } from "../../../layout";
import { StrokeDirection } from "../../../notation";

export const Stroke = (props: { element: layout.Stroke }) => {
  switch (props.element.stroke.direction) {
    case StrokeDirection.Down: {
      const strokeProps: JSX.IntrinsicElements["line"] = { stroke: "#000000", strokeWidth: LINE_STROKE_WIDTH };
      return (
        <>
          <rect
            x={props.element.box.x}
            y={props.element.box.y}
            width={props.element.box.width}
            height={0.5 * props.element.box.height}
            fill="#000000"
          />
          <line
            x1={props.element.box.x}
            x2={props.element.box.x}
            y1={props.element.box.y}
            y2={props.element.box.bottom}
            {...strokeProps}
          />
          <line
            x1={props.element.box.right}
            x2={props.element.box.right}
            y1={props.element.box.y}
            y2={props.element.box.bottom}
            {...strokeProps}
          />
        </>
      );
    }
    case StrokeDirection.Up: {
      const path = `
        M ${props.element.box.x} ${props.element.box.bottom}
        L ${props.element.box.centerX} ${props.element.box.y}
        L ${props.element.box.right} ${props.element.box.bottom}
      `;
      return <path d={path} fill="none" stroke="#000000" />;
    }
  }
};
