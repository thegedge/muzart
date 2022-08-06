import React, { useMemo } from "react";
import layout, { LINE_STROKE_WIDTH } from "../../../layout";
import { CurrentPartContext } from "../../utils/CurrentPartContext";
import { BoxGroup } from "../layout/BoxGroup";
import Page from "../layout/Page";
import { PlaybackBox } from "../misc/PlaybackBox";
import { SelectionBox } from "../misc/SelectionBox";

const BASE_SCALE = 8;

export const Part = (props: { part: layout.Part }) => {
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

  return (
    <CurrentPartContext.Provider value={props.part.part}>
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
    </CurrentPartContext.Provider>
  );
};
