import React from "react";
import layout, { LINE_STROKE_WIDTH } from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";

export function Arc(props: { element: layout.Arc }) {
  const w = props.element.box.width;
  const h = props.element.box.height;
  const offset = 3 * LINE_STROKE_WIDTH;
  return (
    <BoxGroup node={props.element}>
      <path
        d={`
          M 0,0
          C ${w * 0.3},${h} ${w * 0.7},${h} ${w},0
          C ${w * 0.7},${h - offset} ${w * 0.3},${h - offset} 0,0
        `}
        fill="#555555"
        strokeLinecap="round"
      />
    </BoxGroup>
  );
}
