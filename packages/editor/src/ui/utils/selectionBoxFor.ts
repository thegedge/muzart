import * as layout from "@muzart/layout";

export const selectionBoxFor = (chord: layout.Chord | layout.Rest, selectedNoteIndex: number) => {
  const PADDING = 3 * layout.LINE_STROKE_WIDTH;
  const chordBox = layout.toAncestorCoordinateSystem(chord);
  return chordBox
    .update({
      y: chordBox.y + selectedNoteIndex * layout.STAFF_LINE_HEIGHT,
      width: chord.type == "Chord" ? chordBox.width : layout.STAFF_LINE_HEIGHT,
      height: layout.STAFF_LINE_HEIGHT,
    })
    .expand(PADDING);
};
