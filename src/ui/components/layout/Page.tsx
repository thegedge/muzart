import React from "react";
import layout from "../../../layout";
import { ScoreElement } from "../notation/ScoreElement";
import { BoxGroup } from "./BoxGroup";

export const Page = (props: { page: layout.Page }) => {
  const cw = props.page.content.box.width;
  const ch = props.page.content.box.height;
  return (
    <BoxGroup node={props.page}>
      <rect
        width={props.page.box.width}
        height={props.page.box.height}
        fill="#ffffff"
        style={{ filter: "url(#pageShadow)" }}
      />
      <BoxGroup
        node={props.page.content}
        clipPath={`polygon(0 0, ${cw} 0, ${cw} ${ch}, 0 ${ch})`}
        clipPathUnits="userSpaceOnUse"
      >
        {props.page.content.children.map((e, index) => (
          <ScoreElement key={index} element={e} />
        ))}
      </BoxGroup>
    </BoxGroup>
  );
};
