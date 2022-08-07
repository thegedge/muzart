import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";
import { LINE_STROKE_WIDTH, toAncestorCoordinateSystem } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { svgBoxProps } from "../../utils/svg";

export const PlaybackBox = observer(() => {
  const { selection, playback } = useApplicationState();

  const playbackBox = useMemo(() => {
    if (!playback.currentMeasure) {
      return Box.empty();
    }

    return toAncestorCoordinateSystem(playback.currentMeasure);
  }, [playback.currentMeasure, selection.part]);

  const ref = useRef<SVGRectElement>(null);

  useEffect(() => {
    // TODO if it's already visible, perhaps it would be best to not scroll?
    ref.current?.scrollIntoView({ inline: "nearest", block: "center" });
  }, [ref, playback.currentMeasure]);

  return (
    <rect
      ref={ref}
      fill="none"
      stroke="#ff000033"
      strokeWidth={LINE_STROKE_WIDTH * 8}
      visibility={playback.playing ? undefined : "hidden"}
      {...svgBoxProps(playbackBox)}
    />
  );
});
