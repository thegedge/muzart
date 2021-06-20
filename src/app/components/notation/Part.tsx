import React from "react";
import { LINE_STROKE_WIDTH, Part as LayoutPart, STAFF_LINE_HEIGHT } from "../../layout";
import Page from "../layout/Page";

const PAGE_MARGIN = 0.5;
const BASE_SCALE = 8;

export function Part(props: { part: LayoutPart }) {
  let width = 0;
  let height = PAGE_MARGIN;
  const pages = props.part.pages.map((page, index) => {
    const pageElement = (
      <g key={index} transform={`translate(${PAGE_MARGIN} ${height})`}>
        <Page page={page} />
      </g>
    );

    width = Math.max(width, page.box.width);
    height += PAGE_MARGIN + page.box.height;

    return pageElement;
  });

  width += 2 * PAGE_MARGIN;

  const viewBox = `0 0 ${width} ${height}`;
  const style = {
    width: `${width * BASE_SCALE}rem`,
    height: `${height * BASE_SCALE}rem`,
  };

  // TODO Not ideal, because this is same as what we have in `addAboveStaffElements`. More generally, vibrato
  // would probably look much better if we manually constructed a path, because this pattern could get cropped
  // in the middle, which doesn't look good.
  const VIBRATO_HEIGHT = 0.8 * STAFF_LINE_HEIGHT;

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
