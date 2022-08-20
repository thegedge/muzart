import React, { useMemo } from "react";
import layout from "../../../layout";
import { CurrentPartContext } from "../../utils/CurrentPartContext";
import { BoxGroup } from "../layout/BoxGroup";
import { Page } from "../layout/Page";
import { PlaybackBox } from "../misc/PlaybackBox";
import { SelectionBox } from "../misc/SelectionBox";

export const Part = (props: { part: layout.Part }) => {
  const pages = useMemo(() => {
    return props.part.children.map((page, index) => <Page key={index} page={page} />);
  }, [props.part]);

  return (
    <CurrentPartContext.Provider value={props.part.part}>
      <BoxGroup node={props.part}>
        {pages}
        <SelectionBox />
        <PlaybackBox />
      </BoxGroup>
    </CurrentPartContext.Provider>
  );
};
