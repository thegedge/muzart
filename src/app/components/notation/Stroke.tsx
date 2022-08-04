import React from "react";
import { StrokeDirection } from "../../../notation";
import layout, { LINE_STROKE_WIDTH } from "../../layout";

export function Stroke(props: { node: layout.Stroke }) {
  switch (props.node.stroke.direction) {
    case StrokeDirection.Down: {
      const strokeProps: JSX.IntrinsicElements["line"] = { stroke: "#000000", strokeWidth: LINE_STROKE_WIDTH };
      return (
        <>
          <rect
            x={props.node.box.x}
            y={props.node.box.y}
            width={props.node.box.width}
            height={0.5 * props.node.box.height}
            fill="#000000"
            stroke="transparent"
          />
          <line
            x1={props.node.box.x}
            x2={props.node.box.x}
            y1={props.node.box.y}
            y2={props.node.box.bottom}
            {...strokeProps}
          />
          <line
            x1={props.node.box.right}
            x2={props.node.box.right}
            y1={props.node.box.y}
            y2={props.node.box.bottom}
            {...strokeProps}
          />
        </>
      );
    }
    case StrokeDirection.Up: {
      const path = `
        M ${props.node.box.x} ${props.node.box.bottom}
        L ${props.node.box.centerX} ${props.node.box.y}
        L ${props.node.box.right} ${props.node.box.bottom}
      `;
      return <path d={path} fill="none" stroke="#000000" strokeWidth={LINE_STROKE_WIDTH} />;
    }
  }
}
