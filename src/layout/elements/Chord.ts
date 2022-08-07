import types, { chordWidth, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { Box, maxMap } from "../utils";
import { LayoutElement } from "./LayoutElement";
import { Note } from "./Note";

export class Chord extends LayoutElement<"Chord", types.LineElement> implements types.Chord {
  readonly type = "Chord";
  readonly children: (types.Note | types.Stroke)[] = [];

  constructor(readonly chord: notation.Chord) {
    // TODO use num staff lines from ancestor
    const maxNoteChars = maxMap(chord.notes, (note) => note.toString().length) || 1;
    const noteWidth = chordWidth(maxNoteChars);
    super(new Box(0, 0, noteWidth, 6 * STAFF_LINE_HEIGHT));

    this.children = this.chord.notes.map((note) => {
      const noteY = note.placement ? (note.placement.string - 1) * STAFF_LINE_HEIGHT : 0;
      const noteElement = new Note(new Box(0, noteY, noteWidth, STAFF_LINE_HEIGHT), note);
      noteElement.parent = this;
      return noteElement;
    });
  }
}
