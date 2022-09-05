import React from "react";
import layout, { LINE_STROKE_WIDTH } from "../../../layout";
import { BoxGroup } from "../layout/BoxGroup";

export const Arc = (props: { element: layout.Arc }) => {
  const w = props.element.box.width;
  const h = props.element.box.height;
  const offset = 3 * LINE_STROKE_WIDTH;

  let path: string;
  switch (props.element.orientation) {
    case "above":
      path = `
        M 0,${h}
        C ${w * 0.3},0 ${w * 0.7},0 ${w},${h}
        C ${w * 0.7},${offset} ${w * 0.3},${offset} 0,${h}
      `;
      break;
    case "below":
      path = `
        M 0,0
        C ${w * 0.3},${h} ${w * 0.7},${h} ${w},0
        C ${w * 0.7},${h - offset} ${w * 0.3},${h - offset} 0,0
      `;
      break;
  }

  return (
    <BoxGroup element={props.element}>
      <path d={path} fill="#555555" strokeLinecap="round" />
    </BoxGroup>
  );
};
