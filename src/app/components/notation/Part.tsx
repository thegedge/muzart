import React from "react";
import { LINE_STROKE_WIDTH, Part, STAFF_LINE_HEIGHT } from "../../layout";
import Page from "../layout/Page";

const PAGE_MARGIN = 0.5;
const BASE_SCALE = 8;

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

        <pattern
          id="vibrato"
          width={(VIBRATO_HEIGHT * 1.1233) / 1.5}
          height={VIBRATO_HEIGHT}
          viewBox="0 -0.25 1.1233 1.5"
          patternUnits="userSpaceOnUse"
        >
          <path
            fill="#000000"
            d="m 0.688304,0.9802 c -0.252031,-0.32929 -0.177584,-0.22229 -0.445038,-0.61152 l -0.243266,-0.002 c 0.263226,-0.5592 0.444703,-0.43032 0.833124,0.0605 l 0.290176,6.3e-4 c 0,0 -0.06812,0.12133 -0.119681,0.22557 -0.07544,0.1151 -0.237,0.42877 -0.315315,0.32644 z"
          />
        </pattern>
      </defs>
      {pages}
    </svg>
  );
}
