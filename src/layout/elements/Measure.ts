import types from "..";
import * as notation from "../../notation";
import { NoteValue } from "../../notation";
import { STAFF_LINE_HEIGHT } from "../constants";
import { FlexGroup, FlexProps } from "../layouts/FlexGroup";
import { Inches, LineElement } from "../types";
import { Box } from "../utils/Box";
import { Chord } from "./Chord";
import { Rest } from "./Rest";
import { Space } from "./Space";
import { TimeSignature } from "./TimeSignature";

const MIN_NOTE_WIDTH: Inches = 0.2;
const QUARTER_NOTE_WIDTH: Inches = 0.25;

export class Measure extends FlexGroup<LineElement, "Measure", LineElement> {
  readonly type = "Measure";

  public chords: (types.Chord | types.Rest)[] = [];

  constructor(readonly part: notation.Part, readonly measure: notation.Measure) {
    super({
      box: Box.empty(),
      axis: "horizontal",
      crossAxisAlignment: "center",
      defaultFlexProps: {
        factor: null,
      },
    });

    const spacerHeight = 2 * STAFF_LINE_HEIGHT;
    const spacerWidth = QUARTER_NOTE_WIDTH / 2;
    this.box.height = part.lineCount * STAFF_LINE_HEIGHT;

    if (measure.staffDetails.time?.changed) {
      this.addElement(Space.fromDimensions(0.5 * spacerWidth, spacerHeight));
      this.box.width += 0.5 * spacerWidth;

      const timeSig = new TimeSignature(measure.staffDetails.time.value);
      this.addElement(timeSig);
      this.box.width += timeSig.box.width;
    }

    this.addElement(Space.fromDimensions(spacerWidth, spacerHeight));
    this.box.width += spacerWidth;

    // TODO if just a single whole rest, put in center

    for (const chord of measure.chords) {
      let width = widthForValue(chord.value);
      if (chord.rest) {
        this.addElement(new Rest(chord, part.lineCount * STAFF_LINE_HEIGHT));
      } else {
        const hasBend = chord.notes.some((n) => !!n.bend);
        width *= hasBend ? 2 : 1;
        this.addElement(new Chord(chord));
      }

      this.box.width += width;
      this.addElement(Space.fromDimensions(width, spacerHeight), { factor: width });
    }

    // An empty spacer where, used to help us place the measure number
    this.addElement(Space.fromDimensions(0, spacerHeight));
  }

  tryAddElement(element: LineElement, flexProps?: Partial<FlexProps>) {
    const wasAdded = super.tryAddElement(element, flexProps);
    if (wasAdded) {
      if (element instanceof Rest || element instanceof Chord) {
        this.chords.push(element);
      }
    }
    return wasAdded;
  }

  override addElement(element: LineElement, flexProps?: Partial<FlexProps>) {
    super.addElement(element, flexProps);
    if (element instanceof Rest || element instanceof Chord) {
      this.chords.push(element);
    }
  }
}

function widthForValue(value: NoteValue) {
  // TODO this 5 is kind of arbitrary, make it configurable?
  return Math.max(MIN_NOTE_WIDTH, QUARTER_NOTE_WIDTH * (5 * value.toDecimal()));
}
