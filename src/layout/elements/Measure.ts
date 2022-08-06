import types from "..";
import * as notation from "../../notation";
import { NoteValue } from "../../notation";
import { chordWidth, STAFF_LINE_HEIGHT } from "../constants";
import { FlexGroup, FlexProps } from "../layouts/FlexGroup";
import { Inches, LineElement } from "../types";
import { Box } from "../utils/Box";
import { Chord } from "./Chord";
import { Space } from "./Space";
import { TimeSignature } from "./TimeSignature";

const MIN_NOTE_WIDTH: Inches = 0.2;
const QUARTER_NOTE_WIDTH: Inches = 0.25;

export class Measure extends FlexGroup<LineElement, LineElement> {
  readonly type = "Measure";

  public chords: (types.Chord | types.Rest)[] = [];

  constructor(readonly part: notation.Part, readonly measure: notation.Measure) {
    super({ box: new Box(0, 0, 0, 0), axis: "horizontal" });

    const spacerWidth = QUARTER_NOTE_WIDTH / 2;
    this.box.height = part.lineCount * STAFF_LINE_HEIGHT;

    if (measure.staffDetails.time?.changed) {
      this.addElement(Space.fromDimensions(0.5 * spacerWidth, spacerWidth), { factor: null });
      this.box.width += 0.5 * spacerWidth;

      const timeSig = new TimeSignature(measure.staffDetails.time.value);
      this.addElement(timeSig, { factor: null });
      this.box.width += timeSig.box.width;
    }

    this.addElement(Space.fromDimensions(0.5 * spacerWidth, spacerWidth), { factor: null });
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
        this.addElement(new Chord(chord), { factor: null });
      }

      this.box.width += width;
      this.addElement(Space.fromDimensions(width, 1), { factor: width });
    }

    // An empty spacer where, used to help us place the measure number
    this.addElement(Space.fromDimensions(0, 0), { factor: null });
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
    if (element.type == "Rest" || element instanceof Chord) {
      this.chords.push(element);
    }
  }
}

function widthForValue(value: NoteValue) {
  // TODO this 5 is kind of arbitrary, make it configurable?
  return Math.max(MIN_NOTE_WIDTH, QUARTER_NOTE_WIDTH * (5 * value.toDecimal()));
}
