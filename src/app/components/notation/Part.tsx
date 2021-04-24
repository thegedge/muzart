import React from "react";
import { LINE_STROKE_WIDTH, Part } from "../../layout";
import Page from "../layout/Page";

const PAGE_MARGIN = 0.25;

export function Part(props: { part: Part }) {
  let width = 0;
  let height = PAGE_MARGIN;
  const pages = props.part.pages.map((page, index) => {
    const pageElement = (
      <g key={index} transform={`translate(${PAGE_MARGIN} ${height})`}>
        <Page page={page} />
      </g>
    );

    width = Math.max(width, page.width);
    height += PAGE_MARGIN + page.height;

    return pageElement;
  });

  width += 2 * PAGE_MARGIN;

  const viewBox = `0 0 ${width} ${height}`;
  const style = {
    width: `${width * 10}rem`,
    height: `${height * 10}rem`,
  };

  return (
    <svg className="m-auto" style={style} viewBox={viewBox}>
      <defs>
        <filter id="pageShadow">
          <feDropShadow
            dx={LINE_STROKE_WIDTH * 0}
            dy={LINE_STROKE_WIDTH * 0}
            stdDeviation={LINE_STROKE_WIDTH * 10}
            floodOpacity="0.25"
          />
        </filter>
      </defs>
      {pages}
    </svg>
  );
}
