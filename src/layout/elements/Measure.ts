import * as notation from "../../notation";
import { NoteValue } from "../../notation";
import { digits } from "../../utils/digits";
import { chordWidth, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../constants";
import { FlexGroup, FlexProps } from "../layouts/FlexGroup";
import { Chord, Inches, LineElement, Rest } from "../types";
import { maxMap } from "../utils";
import { Box } from "../utils/Box";

const MIN_NOTE_WIDTH: Inches = 0.2;
const QUARTER_NOTE_WIDTH: Inches = 0.25;

export class Measure extends FlexGroup<LineElement, LineElement> {
  readonly type = "Measure";

  public chords: (Chord | Rest)[] = [];

  constructor(readonly part: notation.Part, readonly measure: notation.Measure) {
    super({ box: new Box(0, 0, 0, 0), axis: "horizontal" });

    const spacerWidth = QUARTER_NOTE_WIDTH / 2;
    this.box.height = part.lineCount * STAFF_LINE_HEIGHT;

    if (measure.staffDetails.time?.changed) {
      this.addElement({ type: "Space", box: new Box(0, 0, 0.5 * spacerWidth, spacerWidth) }, { factor: null });
      this.box.width += 0.5 * spacerWidth;

      const timeSignature = measure.staffDetails.time.value;
      const topDigits = digits(timeSignature.count);
      const bottomDigits = digits(timeSignature.value.toNumber());
      const width = STAFF_LINE_HEIGHT * 2 * Math.max(topDigits.length, bottomDigits.length);
      this.addElement(
        {
          type: "TimeSignature",
          // Add a line stroke width for the slightest amount of "padding" between the digits
          box: new Box(0, STAFF_LINE_HEIGHT, width, 4 * STAFF_LINE_HEIGHT + LINE_STROKE_WIDTH),
          timeSignature,
        },
        { factor: null }
      );
      this.box.width += width;
    }

    this.addElement({ type: "Space", box: new Box(0, 0, spacerWidth, spacerWidth) }, { factor: null });
    this.box.width += spacerWidth;

    // TODO if just a single whole rest, put in center

    for (const chord of measure.chords) {
      let width = widthForValue(chord.value);
      if (chord.rest) {
        this.addElement(
          {
            type: "Rest",
            box: new Box(0, 0, chordWidth(4), part.lineCount * STAFF_LINE_HEIGHT),
            chord,
          },
          { factor: null }
        );
      } else {
        const hasBend = chord.notes.some((n) => !!n.bend);
        width *= hasBend ? 2 : 1;

        const chordLayout = layOutChord(chord);
        this.addElement(chordLayout, { factor: null });
      }

      this.box.width += width;
      this.addElement({ type: "Space", box: new Box(0, 0, width, 1) }, { factor: width });
    }

    // An empty spacer where, used to help us place the measure number
    this.addElement({ type: "Space", box: new Box(0, 0, 0, 0) }, { factor: null });
  }

  tryAddElement(element: LineElement, flexProps?: Partial<FlexProps>) {
    const wasAdded = super.tryAddElement(element, flexProps);
    if (wasAdded) {
      if (element.type == "Rest" || element.type == "Chord") {
        this.chords.push(element);
      }
    }
    return wasAdded;
  }

  addElement(element: LineElement, flexProps?: Partial<FlexProps>) {
    super.addElement(element, flexProps);
    if (element.type == "Rest" || element.type == "Chord") {
      this.chords.push(element);
    }
  }
}

function widthForValue(value: NoteValue) {
  // TODO this 5 is kind of arbitrary, make it configurable?
  return Math.max(MIN_NOTE_WIDTH, QUARTER_NOTE_WIDTH * (5 * value.toDecimal()));
}

function layOutChord(chord: notation.Chord): Chord | Rest {
  const maxNoteChars = maxMap(chord.notes, (note) => note.toString().length) || 1;
  const noteWidth = chordWidth(maxNoteChars);
  const chordLayout: Chord = {
    type: "Chord",
    box: new Box(0, 0, noteWidth, 6 * STAFF_LINE_HEIGHT), // TODO use num staff lines from ancestor
    chord,
    elements: [],
  };

  for (const note of chord.notes) {
    const noteY = note.placement ? (note.placement.string - 1) * STAFF_LINE_HEIGHT : 0;

    chordLayout.elements.push({
      type: "Note",
      parent: chordLayout,
      box: new Box(0, noteY, noteWidth, STAFF_LINE_HEIGHT),
      note,
    });
  }

  return chordLayout;
}
