import types, { chordWidth, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { Box, maxMap } from "../utils";
import { LayoutElement } from "./LayoutElement";
import { Note } from "./Note";

export class Chord extends LayoutElement<"Chord", types.LineElement> implements types.Chord {
  readonly type = "Chord";
  readonly children: (types.Note | types.Stroke)[];

  constructor(
    readonly chord: notation.Chord,
    readonly numStaffLines: number,
    readonly staffHeight = STAFF_LINE_HEIGHT,
  ) {
    const maxNoteChars = maxMap(chord.notes, (note) => note.toString().length) || 1;
    const noteWidth = chordWidth(maxNoteChars);
    super(new Box(0, 0, noteWidth, staffHeight * numStaffLines));

    // Take away 2 line strokes so the text elements with a background fill don't obstruct the staff lines
    const noteHeight = staffHeight - 2 * LINE_STROKE_WIDTH;
    this.children = chord.notes.flatMap((note) => {
      const noteY = (note.placement ? (note.placement.string - 1) * staffHeight : 0) + LINE_STROKE_WIDTH;
      const noteElement = new Note(new Box(0, noteY, noteWidth, noteHeight), note);
      noteElement.parent = this;

      if (note.graceNote) {
        // TODO this placement will go outside the chord box, which also means that lots of grace notes in a dense measure may look bad
        const graceNoteElement = new Note(
          new Box(-1.2 * noteWidth, noteY + 0.125 * noteHeight, noteWidth, 0.75 * noteHeight),
          note.graceNote,
        );
        graceNoteElement.parent = this;
        return [noteElement, graceNoteElement];
      }

      return [noteElement];
    });
  }
}
