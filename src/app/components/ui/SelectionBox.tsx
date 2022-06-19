import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";
import { LINE_STROKE_WIDTH, toAncestorCoordinateSystem } from "../../layout";
import { Box } from "../../layout/utils/Box";
import { useApplicationState } from "../utils/ApplicationStateContext";
import { svgBoxProps } from "../utils/svg";

// TODO factor out these "relative to absolute" calculations in the useMemo calls below

export const SelectionBox = observer(() => {
  const { selection, playback } = useApplicationState();

  const measureBox = useMemo(() => {
    if (!selection.measure) {
      return Box.empty();
    }

    return toAncestorCoordinateSystem(selection.measure);
  }, [selection.measure]);

  const elementBox = useMemo(() => {
    if (!selection.element) {
      return Box.empty();
    }

    return toAncestorCoordinateSystem(selection.element);
  }, [selection, selection.element]);

  const ref = useRef<SVGRectElement | null>();

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ inline: "center", block: "center" });
    }
  }, [ref, selection.element]);

  if (playback.playing) {
    const playbackBox = new Box(elementBox.x, measureBox.y, elementBox.width, measureBox.height);

    return (
      <rect
        ref={(instance) => {
          ref.current = instance;
        }}
        fill="#ff000033"
        {...svgBoxProps(playbackBox)}
      />
    );
  } else {
    const padding = 3 * LINE_STROKE_WIDTH;
    return (
      <rect
        ref={(instance) => {
          ref.current = instance;
        }}
        fill="#f0f0a055"
        strokeWidth={LINE_STROKE_WIDTH}
        stroke="#c0c080"
        {...svgBoxProps(elementBox.expand(padding))}
      />
    );
  }
});
