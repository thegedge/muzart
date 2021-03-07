import { range } from "lodash";
import React from "react";
import { Line, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../layout/layout";
import Measure from "./Measure";
import { svgPositionTransform } from "./utils";

export default function Line(props: { line: Line }) {
  return (
    <g transform={svgPositionTransform(props.line)}>
      {range(6).map((staffLineIndex) => (
        <line
          x1={0}
          y1={(staffLineIndex + 0.5) * STAFF_LINE_HEIGHT}
          x2={props.line.width}
          y2={(staffLineIndex + 0.5) * STAFF_LINE_HEIGHT}
          stroke="black"
          strokeWidth={LINE_STROKE_WIDTH}
        />
      ))}

      {props.line.elements.map((e, index) => {
        switch (e.type) {
          case "Measure":
            return <Measure key={index} measure={e} />;
          case "BarLine":
            return (
              <line
                x1={e.x}
                y1={e.y}
                x2={e.x + e.width}
                y2={e.y + e.height}
                stroke="black"
                strokeWidth={e.strokeSize}
              />
            );
        }
      })}
    </g>
  );
}
