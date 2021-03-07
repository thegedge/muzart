import React from "react";
import { Page } from "../layout/layout";
import Line from "./Line";

export default function Page(props: { page: Page }) {
  const viewBox = `0 0 ${props.page.width} ${props.page.height}`;
  return (
    <div className="bg-white border-black border w-5/6">
      <svg viewBox={viewBox} className="w-full h-full">
        {/* TODO clip path for the bottom/right margins */}

        <g transform={`translate(${props.page.margins.left} ${props.page.margins.top})`}>
          {props.page.lines.map((line, index) => (
            <Line key={index} line={line} />
          ))}
        </g>
      </svg>
    </div>
  );
}
