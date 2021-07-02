import * as notation from "../../../notation";
import { NoteValue } from "../../../notation";
import { STAFF_LINE_HEIGHT } from "../constants";
import { FlexGroup, FlexGroupElement, FlexProps } from "../layouts/FlexGroup";
import { Chord, Inches, LineElement, Rest, Text } from "../types";
import { maxMap } from "../utils";
import Box from "../utils/Box";

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
      const ts = measure.staffDetails.time.value;
      const size = STAFF_LINE_HEIGHT * 2.5;
      const group = new FlexGroupElement<Text>({
        box: new Box(0, 0.5 * STAFF_LINE_HEIGHT, size, STAFF_LINE_HEIGHT * (part.lineCount - 1)),
        axis: "vertical",
      });

      group.addElement({
        type: "Text",
        box: new Box(0, 0, size, size),
        size,
        value: ts.count.toString(),
        halign: "middle",
        valign: "middle",
        style: {
          fontWeight: "bold",
        },
      });

      group.addElement({
        type: "Text",
        box: new Box(0, 0, size, size),
        size,
        value: Math.round(1 / ts.value.toDecimal()).toString(),
        halign: "middle",
        valign: "middle",
        style: {
          fontWeight: "bold",
        },
      });

      group.layout();
      this.addElement({ type: "Space", box: new Box(0, 0, 0.5 * spacerWidth, spacerWidth) }, { factor: null });
      this.box.width += 0.5 * spacerWidth;
      this.addElement(group, { factor: null });
      this.box.width += size;
    }

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
      parent: chordLayout,
      // box: new Box((width - noteWidth) * 0.5, noteY, noteWidth, STAFF_LINE_HEIGHT),
      box: new Box(0, noteY, noteWidth, STAFF_LINE_HEIGHT),
      note,
    });
  }

  return chordLayout;
}
