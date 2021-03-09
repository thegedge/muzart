import { range } from "lodash";
import React from "react";
import { LineElement, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT, Text } from "../layout";
import Measure from "./Measure";
import { svgPositionTransform } from "./utils";

export default function LineElementComponent(props: { element: LineElement }) {
  switch (props.element.type) {
    case "Group":
      return (
        <g transform={svgPositionTransform(props.element)}>
          {props.element.drawStaffLines &&
            range(6).map((staffLineIndex) => (
              <line
                x1={0}
                y1={(staffLineIndex + 0.5) * STAFF_LINE_HEIGHT}
                x2={props.element.box.width}
                y2={(staffLineIndex + 0.5) * STAFF_LINE_HEIGHT}
                stroke="black"
                strokeWidth={LINE_STROKE_WIDTH}
              />
            ))}
          {props.element.elements.map((e, index) => (
            <LineElementComponent key={index} element={e} />
          ))}
        </g>
      );
    case "Text":
      return <TextElement text={props.element} />;
    case "Measure":
      return <Measure measure={props.element} />;
    case "BarLine":
      return (
        <line
          x1={props.element.box.x}
          y1={props.element.box.y}
          x2={props.element.box.right}
          y2={props.element.box.bottom}
          stroke="black"
          strokeWidth={props.element.strokeSize}
        />
      );
    default:
      return <></>;
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
