import * as notation from "../notation";
import Box from "./Box";
import { FlexGroup } from "./FlexGroup";
import { STAFF_LINE_HEIGHT } from "./layout";
import { Chord, Inches, Space } from "./types";

const MIN_NOTE_WIDTH = 0.2;
const QUARTER_NOTE_WIDTH: Inches = 0.5;

export class Measure extends FlexGroup<Chord | Space> {
  readonly type = "Measure";

  constructor(readonly measure: notation.Measure, divisions: number) {
    super({ box: new Box(0, 0, 0, 0), axis: "horizontal" });

    let numStaffLines = 6;
    if (measure.staveDetails) {
      // TODO get staff details from previous measure, if one not given, so we can get lines
      numStaffLines = measure.staveDetails[0].lineCount;
    }

    const spacerWidth = QUARTER_NOTE_WIDTH / 8;

    this.box.width = spacerWidth;
    this.box.height = numStaffLines * STAFF_LINE_HEIGHT;

    this.addElement({ type: "Space", box: new Box(0, 0, spacerWidth, spacerWidth) }, { factor: null });

    for (const chord of measure.chords) {
      const chordLayout = layOutChord(chord, divisions);
      chordLayout.box.x = this.box.width;
      this.box.width += chordLayout.box.width;
      this.addElement(chordLayout, { factor: chordLayout.box.width });
    }

    this.addElement({ type: "Space", box: new Box(0, 0, spacerWidth, spacerWidth) }, { factor: null });
    this.box.width += spacerWidth;
  }
}

function layOutChord(chord: notation.Chord, divisions: number): Chord {
  const chordLayout: Chord = {
    type: "Chord",
    box: new Box(0, 0, 0, 0),
    chord,
    notes: [],
  };

  for (const note of notation.notes(chord)) {
    if (note.tie === "stop") {
      continue;
    }

    const noteWidth = Math.max(MIN_NOTE_WIDTH, (QUARTER_NOTE_WIDTH * note.duration) / divisions);
    const noteY = note.placement ? (note.placement.string - 1) * STAFF_LINE_HEIGHT : 0;

    chordLayout.box.width = Math.max(chordLayout.box.width, noteWidth);
    chordLayout.box.height = Math.max(chordLayout.box.height, noteY + STAFF_LINE_HEIGHT);
    chordLayout.notes.push({
      type: "Note",
      box: new Box(0, noteY, noteWidth, STAFF_LINE_HEIGHT),
      note,
    });
  }

  return chordLayout;
}
