import React from "react";
import { Page } from "../layout";
import LineElementComponent from "./LineElement";

export default function Page(props: { page: Page }) {
  const viewBox = `0 0 ${props.page.width} ${props.page.height}`;
  return (
    <div className="bg-white border-black border m-4">
      <svg viewBox={viewBox} style={{ width: "85rem", height: "110rem" }}>
        {/* TODO clip path for the bottom/right margins */}
        <g transform={`translate(${props.page.margins.left} ${props.page.margins.top})`}>
          {props.page.elements.map((e, index) => (
            <LineElementComponent key={index} element={e} />
          ))}
        </g>
      </svg>
    </div>
  );
}
