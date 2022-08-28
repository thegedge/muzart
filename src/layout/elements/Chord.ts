import types, { chordWidth, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { Box, maxMap } from "../utils";
import { LayoutElement } from "./LayoutElement";
import { Note } from "./Note";

export class Chord extends LayoutElement<"Chord", types.LineElement> implements types.Chord {
  readonly type = "Chord";
  readonly children: (types.Note | types.Stroke)[];

  constructor(readonly chord: notation.Chord, readonly numStaffLines: number) {
    const maxNoteChars = maxMap(chord.notes, (note) => note.toString().length) || 1;
    const noteWidth = chordWidth(maxNoteChars);
    super(new Box(0, 0, noteWidth, STAFF_LINE_HEIGHT * numStaffLines));

    this.children = chord.notes.map((note) => {
      const noteY = note.placement ? (note.placement.string - 1) * STAFF_LINE_HEIGHT : 0;
      const noteElement = new Note(
        new Box(0, noteY + LINE_STROKE_WIDTH, noteWidth, STAFF_LINE_HEIGHT - 2 * LINE_STROKE_WIDTH),
        note
      );
      noteElement.parent = this;
      return noteElement;
    });
  }
}
