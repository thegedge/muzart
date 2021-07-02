import React from "react";
import { Page } from "../../layout";
import ScoreElement from "../notation/ScoreElement";
import { BoxGroup } from "./BoxGroup";

export default function Page(props: { page: Page }) {
  return (
    <BoxGroup node={props.page}>
      <rect
        width={props.page.box.width}
        height={props.page.box.height}
        fill="#ffffff"
        style={{ filter: "url(#pageShadow)" }}
      />
      {/* TODO make this be single child Group of page, to avoid the custom transform */}
      <g transform={`translate(${props.page.margins.left} ${props.page.margins.top})`}>
        {props.page.elements.map((e, index) => (
          <ScoreElement key={index} element={e} />
        ))}
      </g>
    </BoxGroup>
  );
}
