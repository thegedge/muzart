import types, { chordWidth, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { Box, maxMap } from "../utils";
import { LayoutElement } from "./LayoutElement";

export class Chord extends LayoutElement<"Chord", types.LineElement> implements types.Chord {
  readonly type = "Chord";
  readonly elements: (types.Note | types.Stroke)[] = [];

  private noteWidth: number;

  constructor(readonly chord: notation.Chord) {
    // TODO use num staff lines from ancestor
    const maxNoteChars = maxMap(chord.notes, (note) => note.toString().length) || 1;
    const noteWidth = chordWidth(maxNoteChars);
    super(new Box(0, 0, noteWidth, 6 * STAFF_LINE_HEIGHT));

    this.noteWidth = noteWidth;
  }

  layout() {
    for (const note of this.chord.notes) {
      const noteY = note.placement ? (note.placement.string - 1) * STAFF_LINE_HEIGHT : 0;
      this.elements.push({
        type: "Note",
        parent: this,
        box: new Box(0, noteY, this.noteWidth, STAFF_LINE_HEIGHT),
        note,
      });
    }
  }
}
