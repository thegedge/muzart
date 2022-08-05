import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";
import { LINE_STROKE_WIDTH, PAGE_MARGIN, toAncestorCoordinateSystem } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { svgBoxProps } from "../../utils/svg";

const hPadding = 10 * LINE_STROKE_WIDTH;
const vPadding = 0;

export const PlaybackBox = observer(() => {
  const { selection, playback } = useApplicationState();

  const playbackBox = useMemo(() => {
    if (!playback.currentMeasure) {
      return Box.empty();
    }

    // TODO avoid having to do this adjustment by having pages not have to offset themselves by PAGE_MARGIN (make part a group)
    return toAncestorCoordinateSystem(playback.currentMeasure).expand(hPadding, vPadding).translate(-PAGE_MARGIN);
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
