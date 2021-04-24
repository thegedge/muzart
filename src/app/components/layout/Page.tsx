import React from "react";
import { Page } from "../../layout";
import LineElementComponent from "../notation/LineElement";

export default function Page(props: { page: Page }) {
  return (
    <>
      <rect width={props.page.width} height={props.page.height} fill="#ffffff" style={{ filter: "url(#pageShadow)" }} />
      <g transform={`translate(${props.page.margins.left} ${props.page.margins.top})`}>
        {props.page.elements.map((e, index) => (
          <LineElementComponent key={index} element={e} />
        ))}
      </g>
    </>
  );
}
