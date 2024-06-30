import layout, { LINE_STROKE_WIDTH, toAncestorCoordinateSystem, STAFF_LINE_HEIGHT } from "../../../layout";

export const selectionBoxFor = (chord: layout.Chord | layout.Rest, selectedNoteIndex: number) => {
  const PADDING = 3 * LINE_STROKE_WIDTH;
  const chordBox = toAncestorCoordinateSystem(chord);
  return chordBox
    .update({
      y: chordBox.y + selectedNoteIndex * STAFF_LINE_HEIGHT,
      width: chord.type == "Chord" ? chordBox.width : STAFF_LINE_HEIGHT,
      height: STAFF_LINE_HEIGHT,
    })
    .expand(PADDING);
};
