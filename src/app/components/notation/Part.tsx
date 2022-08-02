import React, { useMemo } from "react";
import { LINE_STROKE_WIDTH, Part as LayoutPart } from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";
import Page from "../layout/Page";
import { PlaybackBox } from "../ui/PlaybackBox";
import { SelectionBox } from "../ui/SelectionBox";

const BASE_SCALE = 8;

export function Part(props: { part: LayoutPart }) {
  const partBox = props.part.box;
  const viewBox = `0 0 ${partBox.width} ${partBox.height}`;
  const style = {
    width: `${partBox.width * BASE_SCALE}rem`,
    height: `${partBox.height * BASE_SCALE}rem`,
  };

  const pages = useMemo(
    () =>
      props.part.pages.map((page, index) => {
        return <Page key={index} page={page} />;
      }),
    [props.part]
  );

  // TODO make <Score> be the <svg> component
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
      <BoxGroup node={props.part}>
        {pages}
        <SelectionBox />
        <PlaybackBox />
      </BoxGroup>
    </svg>
  );
}
