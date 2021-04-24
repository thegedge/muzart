import React from "react";
import { Arc, LINE_STROKE_WIDTH } from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";

export function Arc(props: { element: Arc }) {
  const w = props.element.box.width;
  const h = props.element.box.height;
  const scale = 0.7;
  const offset = 2 * LINE_STROKE_WIDTH;
  return (
    <BoxGroup node={props.element}>
      <path
        d={`
          M 0,0
          C ${w * 0.25},${h} ${w * 0.75},${h} ${w},0
          m ${-offset},0
          C ${w * 0.75},${h * scale} ${w * 0.25},${h * scale} ${offset},0
        `}
        fill="#555555"
      />
    </BoxGroup>
  );
}
