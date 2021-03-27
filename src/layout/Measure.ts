import * as notation from "../notation";
import Box from "./Box";
import { STAFF_LINE_HEIGHT } from "./constants";
import { FlexGroup } from "./FlexGroup";
import { Chord, Inches, Rest, Space } from "./types";
import { maxMap, numCharsToRepresent } from "./utils";

const MIN_NOTE_WIDTH: Inches = 0.2;
const QUARTER_NOTE_WIDTH: Inches = 0.25;

export class Measure extends FlexGroup<Chord | Rest | Space> {
  readonly type = "Measure";

  private chordElements: (Chord | Rest)[] = [];

  constructor(readonly part: notation.Part, readonly measure: notation.Measure) {
    super({ box: new Box(0, 0, 0, 0), axis: "horizontal" });

    const spacerWidth = QUARTER_NOTE_WIDTH / 2;

    this.box.width = spacerWidth;
    this.box.height = part.lineCount * STAFF_LINE_HEIGHT;

    this.addElement({ type: "Space", box: new Box(0, 0, spacerWidth, spacerWidth) }, { factor: spacerWidth });

    for (const chord of measure.chords) {
      const chordLayout = layOutChord(chord, part.lineCount);
      chordLayout.box.x = this.box.width;
      this.box.width += chordLayout.box.width;
      this.addElement(chordLayout, { factor: chordLayout.box.width });
      this.chordElements.push(chordLayout);
    }

    this.addElement({ type: "Space", box: new Box(0, 0, spacerWidth, spacerWidth) }, { factor: spacerWidth });
    this.box.width += spacerWidth;
  }

  chordX(beat: number): number {
    const chord = this.chordElements[beat];
    return chord.box?.x || 0;
  }
}

function layOutChord(chord: notation.Chord, numStrings: number): Chord | Rest {
  // TODO this 3 is kind of arbitrary, make it configurable?
  const width = Math.max(MIN_NOTE_WIDTH, QUARTER_NOTE_WIDTH * (3 * chord.value.toDecimal()));

  if (chord.rest) {
    return {
      type: "Rest",
      box: new Box(0, 2.5 * STAFF_LINE_HEIGHT, width, (numStrings - 2.5) * STAFF_LINE_HEIGHT),
      chord,
    };
  }

  const chordLayout: Chord = {
    type: "Chord",
    box: new Box(0, 0, width, STAFF_LINE_HEIGHT),
    chord,
    notes: [],
  };

  const maxNoteChars = maxMap(chord.notes, (note) => numCharsToRepresent(note.placement?.fret || 0)) || 1;
  const noteWidth = STAFF_LINE_HEIGHT * (0.5 + 0.3 * maxNoteChars);
  for (const note of chord.notes) {
    if (note.tie === "stop") {
      continue;
    }

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
