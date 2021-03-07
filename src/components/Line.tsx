import { range } from "lodash";
import React from "react";
import { Line, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../layout/layout";
import Measure from "./Measure";
import { svgPositionTransform } from "./utils";

export default function Line(props: { line: Line }) {
  if ("measures" in props.line) {
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

        <line
          x1={0}
          y1={0.5 * STAFF_LINE_HEIGHT}
          x2={0}
          y2={5.5 * STAFF_LINE_HEIGHT}
          stroke="black"
          strokeWidth={LINE_STROKE_WIDTH}
        />

        {props.line.measures.map((measure) => (
          <line
            x1={measure.x + measure.width}
            y1={0.5 * STAFF_LINE_HEIGHT}
            x2={measure.x + measure.width}
            y2={5.5 * STAFF_LINE_HEIGHT}
            stroke="black"
            strokeWidth={LINE_STROKE_WIDTH}
          />
        ))}

        {props.line.measures.map((measure, index) => (
          <Measure key={index} measure={measure} />
        ))}
      </g>
    );
  } else {
    return <div className="flex-1">{props.line.value}</div>;
  }
}
