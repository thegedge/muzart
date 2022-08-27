import React from "react";
import layout from "../../../layout";
import { ScoreElement } from "../notation/ScoreElement";
import { BoxGroup } from "./BoxGroup";

export const Page = (props: { page: layout.Page }) => {
  return (
    <BoxGroup node={props.page}>
      <rect
        width={props.page.box.width}
        height={props.page.box.height}
        fill="#ffffff"
        style={{ filter: "url(#pageShadow)" }}
      />
      <BoxGroup node={props.page.content} clip>
        {props.page.content.children.map((e, index) => (
          <ScoreElement key={index} element={e} />
        ))}
      </BoxGroup>
    </BoxGroup>
  );
};
