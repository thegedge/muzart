import { range } from "lodash";
import React from "react";
import { Line, LineElement, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT, Text } from "../layout";
import Measure from "./Measure";
import { svgPositionTransform } from "./utils";

export default function Line(props: { line: Line }) {
  // TODO less assumptions for when/where to draw staff lines. We could also consider drawing it on
  //      a per-measure basis. Layout could also place a run of measures in a special element.

  let children: React.ReactNode;
  if (props.line.elements.length == 1 && props.line.elements[0].type == "Text") {
    children = <TextElement text={props.line.elements[0]} />;
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

        {props.line.elements.map((e) => elementFor(e))}
      </>
    );
  }

  return <g transform={svgPositionTransform(props.line.box)}>{children}</g>;
}

function elementFor(element: LineElement) {
  switch (element.type) {
    case "Group":
      return <g transform={svgPositionTransform(element)}>{element.elements.map((e) => elementFor(e))}</g>;
    case "Text":
      return <TextElement text={element} />;
    case "Measure":
      return <Measure measure={element} />;
    case "BarLine":
      return (
        <line
          x1={element.box.x}
          y1={element.box.y}
          x2={element.box.right}
          y2={element.box.bottom}
          stroke="black"
          strokeWidth={element.strokeSize}
        />
      );
  }
}

function TextElement(props: { text: Text }) {
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
      x = 0;
      anchor = "start";
      break;
  }

  return (
    <text
      x={x}
      y={y}
      dominantBaseline="middle"
      textAnchor={anchor}
      style={{ fontSize: props.text.size, lineHeight: props.text.size, ...props.text.style }}
    >
      {props.text.value}
    </text>
  );
}
