import { range } from "lodash";
import React from "react";
import { Line, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../layout/layout";
import Measure from "./Measure";
import { svgPositionTransform } from "./utils";

export default function Line(props: { line: Line }) {
  // TODO avoid assumption that line won't have staff lines when there's a single text element
  let children: React.ReactNode;
  if (props.line.elements[0] && props.line.elements[0].type == "Text") {
    const text = props.line.elements[0];

    let x = 0;
    let y = text.box.bottom / 2;
    let anchor: string;
    switch (text.align) {
      case "center":
        x = text.box.right / 2;
        anchor = "middle";
        break;
      case "right":
        x = text.box.right;
        anchor = "end";
        break;
      case "left":
        x = 0;
        anchor = "start";
        break;
    }

    children = (
      <text
        x={x}
        y={y}
        dominantBaseline="middle"
        textAnchor={anchor}
        style={{ fontSize: text.size, fontFamily: "Times New Roman" }}
      >
        {props.line.elements[0].value}
      </text>
    );
  } else {
    children = (
      <>
        {range(6).map((staffLineIndex) => (
          <line
            x1={0}
            y1={(staffLineIndex + 0.5) * STAFF_LINE_HEIGHT}
            x2={props.line.box.width}
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
                  x1={e.box.x}
                  y1={e.box.y}
                  x2={e.box.right}
                  y2={e.box.bottom}
                  stroke="black"
                  strokeWidth={e.strokeSize}
                />
              );
          }
        })}
      </>
    );
  }

  return <g transform={svgPositionTransform(props.line.box)}>{children}</g>;
}
