import React from "react";
import { LINE_STROKE_WIDTH, PAGE_MARGIN, Part as LayoutPart } from "../../layout";
import Page from "../layout/Page";
import { SelectionBox } from "../ui/SelectionBox";

const BASE_SCALE = 8;

export function Part(props: { part: LayoutPart }) {
  let width = 0;
  let height = 0;
  const pages = props.part.pages.map((page, index) => {
    width = Math.max(width, page.box.right);
    height = Math.max(height, page.box.bottom);
    return <Page key={index} page={page} />;
  });

  width += 2 * PAGE_MARGIN;
  height += 2 * PAGE_MARGIN;

  const viewBox = `${-PAGE_MARGIN} ${-PAGE_MARGIN} ${width} ${height}`;
  const style = {
    width: `${width * BASE_SCALE}rem`,
    height: `${height * BASE_SCALE}rem`,
  };

  // TODO maybe lift <svg> higher? (e.g., selection box may be better outside of here?)
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
      <SelectionBox />
    </svg>
  );
}
