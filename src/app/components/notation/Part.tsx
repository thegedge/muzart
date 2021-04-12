import React from "react";
import { Part } from "../../layout";
import Page from "../layout/Page";

export function Part(props: { part: Part }) {
  return (
    <div className="flex flex-row flex-wrap items-center justify-center">
      {props.part.pages.map((page, index) => (
        <Page key={index} page={page} />
      ))}
    </div>
  );
}
