import React from "react";
import layout from "../../layout";
import ScoreElement from "../notation/ScoreElement";
import { BoxGroup } from "./BoxGroup";

export default function Page(props: { page: layout.Page }) {
  return (
    <BoxGroup node={props.page}>
      <rect
        width={props.page.box.width}
        height={props.page.box.height}
        fill="#ffffff"
        style={{ filter: "url(#pageShadow)" }}
      />
      <ScoreElement element={props.page.content} />
    </BoxGroup>
  );
}
