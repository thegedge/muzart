import * as notation from "../../../notation";
import { NoteValue } from "../../../notation";
import { STAFF_LINE_HEIGHT } from "../constants";
import { FlexGroup } from "../layouts/FlexGroup";
import { Chord, Inches, Rest, Space } from "../types";
import { maxMap } from "../utils";
import Box from "../utils/Box";

const MIN_NOTE_WIDTH: Inches = 0.2;
const QUARTER_NOTE_WIDTH: Inches = 0.25;

export class Measure extends FlexGroup<Chord | Rest | Space> {
  readonly type = "Measure";

  constructor(readonly part: notation.Part, readonly measure: notation.Measure) {
    super({ box: new Box(0, 0, 0, 0), axis: "horizontal" });

    const spacerWidth = QUARTER_NOTE_WIDTH / 2;
    this.box.height = part.lineCount * STAFF_LINE_HEIGHT;

    this.addElement({ type: "Space", box: new Box(0, 0, spacerWidth, spacerWidth) }, { factor: null });
    this.box.width += spacerWidth;

    // TODO if just one rest, lay out differently (centered?)

    for (const chord of measure.chords) {
      if (chord.rest) {
        const width = widthForValue(chord.value);
        this.addElement({
          type: "Rest",
          box: new Box(0, 0, width, part.lineCount * STAFF_LINE_HEIGHT),
          chord,
        });
        this.box.width += width;
      } else {
        const hasBend = chord.notes.some((n) => !!n.bend);
        const width = widthForValue(chord.value) * (hasBend ? 2 : 1);
        const chordLayout = layOutChord(chord);
        this.addElement(chordLayout, { factor: null });
        this.addElement({ type: "Space", box: new Box(0, 0, width, 1) }, { factor: width });
        this.box.width += chordLayout.box.width + width;
      }
    }

    this.addElement({ type: "Space", box: new Box(0, 0, spacerWidth, spacerWidth) }, { factor: null });
    this.box.width += spacerWidth;
  }
}

function widthForValue(value: NoteValue) {
  // TODO this 3 is kind of arbitrary, make it configurable?
  return Math.max(MIN_NOTE_WIDTH, QUARTER_NOTE_WIDTH * (3 * value.toDecimal()));
}

function layOutChord(chord: notation.Chord): Chord | Rest {
  const maxNoteChars = maxMap(chord.notes, (note) => note.toString().length) || 1;
  const noteWidth = STAFF_LINE_HEIGHT * (0.5 + 0.3 * maxNoteChars);
  const chordLayout: Chord = {
    type: "Chord",
    box: new Box(0, 0, noteWidth, STAFF_LINE_HEIGHT),
    chord,
    notes: [],
  };

  for (const note of chord.notes) {
    const noteY = note.placement ? (note.placement.string - 1) * STAFF_LINE_HEIGHT : 0;

    chordLayout.box.height = Math.max(chordLayout.box.height, noteY + STAFF_LINE_HEIGHT);
    chordLayout.notes.push({
      type: "Note",
      // box: new Box((width - noteWidth) * 0.5, noteY, noteWidth, STAFF_LINE_HEIGHT),
      box: new Box(0, noteY, noteWidth, STAFF_LINE_HEIGHT),
      note,
    });
  }

  return chordLayout;
}
