import { range } from "lodash";
import React from "react";
import { LineElement, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import { Measure } from "./Measure";
import { StemBeam } from "./StemBeam";
import { TextElement } from "./TextElement";

const STAFF_LINE_COLOR = "#555555";

export default function LineElementComponent(props: { element: LineElement }) {
  switch (props.element.type) {
    case "Group":
      return (
        <BoxGroup node={props.element}>
          {props.element.drawStaffLines &&
            range(6).map((staffLineIndex) => (
              <line
                x1={0}
                y1={(staffLineIndex + 0.5) * STAFF_LINE_HEIGHT}
                x2={props.element.box.width}
                y2={(staffLineIndex + 0.5) * STAFF_LINE_HEIGHT}
                stroke={STAFF_LINE_COLOR}
                strokeWidth={LINE_STROKE_WIDTH}
              />
            ))}
          {props.element.elements.map((e, index) => (
            <LineElementComponent key={index} element={e} />
          ))}
        </BoxGroup>
      );
    case "Text":
      return <TextElement {...props.element} text={props.element.value} />;
    case "Measure":
      return <Measure measure={props.element} />;
    case "BarLine":
      return (
        <line
          x1={props.element.box.centerX}
          y1={props.element.box.y}
          x2={props.element.box.centerX}
          y2={props.element.box.bottom}
          stroke="black"
          strokeWidth={props.element.strokeSize}
        />
      );
    case "DurationStem":
      return <StemBeam node={props.element} />;
    default:
      return <></>;
  }
}
