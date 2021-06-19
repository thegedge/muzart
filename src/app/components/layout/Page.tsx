import React from "react";
import { Page } from "../../layout";
import ScoreElement from "../notation/ScoreElement";

export default function Page(props: { page: Page }) {
  return (
    <>
      <rect
        width={props.page.box.width}
        height={props.page.box.height}
        fill="#ffffff"
        style={{ filter: "url(#pageShadow)" }}
      />
      <g transform={`translate(${props.page.margins.left} ${props.page.margins.top})`}>
        {props.page.elements.map((e, index) => (
          <ScoreElement key={index} element={e} />
        ))}
      </g>
    </>
  );
}
