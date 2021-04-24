import React from "react";
import { LINE_STROKE_WIDTH, Page } from "../../layout";
import LineElementComponent from "../notation/LineElement";

export default function Page(props: { page: Page }) {
  return (
    <>
      <rect
        width={props.page.width}
        height={props.page.height}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={LINE_STROKE_WIDTH}
      />
      <g transform={`translate(${props.page.margins.left} ${props.page.margins.top})`}>
        {props.page.elements.map((e, index) => (
          <LineElementComponent key={index} element={e} />
        ))}
      </g>
    </>
  );
}
