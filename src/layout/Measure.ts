import * as notation from "../notation";
import Box from "./Box";
import { FlexGroup } from "./FlexGroup";
import { STAFF_LINE_HEIGHT } from "./layout";
import { Chord, Inches, Rest, Space } from "./types";

const MIN_NOTE_WIDTH = 0.2;
const QUARTER_NOTE_WIDTH: Inches = 0.2;

export class Measure extends FlexGroup<Chord | Rest | Space> {
  readonly type = "Measure";

  private chordElements: (Chord | Rest)[] = [];

  constructor(readonly part: notation.Part, readonly measure: notation.Measure) {
    super({ box: new Box(0, 0, 0, 0), axis: "horizontal" });

    const spacerWidth = QUARTER_NOTE_WIDTH / 4;

    this.box.width = spacerWidth;
    this.box.height = part.lineCount * STAFF_LINE_HEIGHT;

    this.addElement({ type: "Space", box: new Box(0, 0, spacerWidth, spacerWidth) }, { factor: null });

    for (const chord of measure.chords) {
      const chordLayout = layOutChord(chord, part.lineCount);
      chordLayout.box.x = this.box.width;
      this.box.width += chordLayout.box.width;
      this.addElement(chordLayout, { factor: chordLayout.box.width });
      this.chordElements.push(chordLayout);
    }

    this.addElement({ type: "Space", box: new Box(0, 0, spacerWidth, spacerWidth) }, { factor: null });
    this.box.width += 11 * spacerWidth;
  }

  chordX(beat: number): number {
    const chord = this.chordElements[beat];
    return chord.box?.x || 0;
  }
}

function layOutChord(chord: notation.Chord, numStrings: number): Chord | Rest {
  const width = Math.max(MIN_NOTE_WIDTH, QUARTER_NOTE_WIDTH * (4 / chord.duration.toInt()));

  if (chord.rest) {
    return {
      type: "Rest",
      box: new Box(0, 0, width, numStrings * STAFF_LINE_HEIGHT),
      chord,
    };
  }

  const chordLayout: Chord = {
    type: "Chord",
    box: new Box(0, 0, width, STAFF_LINE_HEIGHT),
    chord,
    notes: [],
  };

  for (const note of chord.notes) {
    if (note.tie === "stop") {
      continue;
    }

    const noteWidth = STAFF_LINE_HEIGHT * (0.5 + 0.3 * (note.placement?.fret.toString().length || 1));
    const noteY = note.placement ? (note.placement.string - 1) * STAFF_LINE_HEIGHT : 0;

    chordLayout.box.height = Math.max(chordLayout.box.height, noteY + STAFF_LINE_HEIGHT);
    chordLayout.notes.push({
      type: "Note",
      box: new Box((width - noteWidth) * 0.5, noteY, noteWidth, STAFF_LINE_HEIGHT),
      note,
    });
  }

  return chordLayout;
}
