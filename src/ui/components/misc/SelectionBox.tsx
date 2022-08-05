import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useRef } from "react";
import { LINE_STROKE_WIDTH, PAGE_MARGIN, STAFF_LINE_HEIGHT, toAncestorCoordinateSystem } from "../../../layout";
import { Box } from "../../../layout/utils/Box";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { svgBoxProps } from "../../utils/svg";

const padding = 3 * LINE_STROKE_WIDTH;

export const SelectionBox = observer(() => {
  const { selection, playback } = useApplicationState();

  const elementBox = useMemo(() => {
    if (!selection.chord) {
      return Box.empty();
    }

    // TODO avoid having to do this adjustment by having pages not have to offset themselves by PAGE_MARGIN (make part a group)
    const chordBox = toAncestorCoordinateSystem(selection.chord).translate(-PAGE_MARGIN);
    return chordBox.update({
      y: chordBox.y + selection.noteIndex * STAFF_LINE_HEIGHT,
      width: selection.chord.type == "Chord" ? chordBox.width : STAFF_LINE_HEIGHT,
      height: STAFF_LINE_HEIGHT,
    });
  }, [selection, selection.chord, selection.noteIndex]);

  const ref = useRef<SVGRectElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ inline: "nearest", block: "center" });
    }
  }, [ref, selection.element]);

  return (
    <rect
      ref={ref}
      fill="#f0f0a055"
      strokeWidth={LINE_STROKE_WIDTH}
      stroke="#c0c080"
      visibility={playback.playing ? "hidden" : undefined}
      {...svgBoxProps(elementBox.expand(padding))}
    />
  );
});
