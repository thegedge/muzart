import types from "..";
import * as notation from "../../notation";
import { NoteValue, NoteValueName } from "../../notation";
import { STAFF_LINE_HEIGHT } from "../constants";
import { FlexGroup } from "../layouts/FlexGroup";
import { LineElement, Millimetres } from "../types";
import { Box } from "../utils/Box";
import { Chord } from "./Chord";
import { Rest } from "./Rest";
import { Space } from "./Space";
import { TimeSignature } from "./TimeSignature";

const MIN_NOTE_WIDTH: Millimetres = 5;
const QUARTER_NOTE_WIDTH: Millimetres = 6;

export class Measure extends FlexGroup<LineElement, "Measure", LineElement> {
  readonly type = "Measure";

  public chords: (types.Chord | types.Rest)[] = [];

  constructor(readonly part: notation.Part, readonly measure: notation.Measure) {
    super({
      box: Box.empty(),
      axis: "horizontal",
      crossAxisAlignment: "center",
      defaultStretchFactor: 0,
    });

    const singleWholeRest =
      measure.chords.length == 1 && measure.chords[0].rest && measure.chords[0].value.name == NoteValueName.Whole;
    const spacerHeight = 2 * STAFF_LINE_HEIGHT;
    const spacerWidth = QUARTER_NOTE_WIDTH / 2;
    this.box.height = part.lineCount * STAFF_LINE_HEIGHT;

    this.addElement(Space.fromDimensions(0.5 * STAFF_LINE_HEIGHT, spacerHeight), 0);

    if (measure.staffDetails.time?.changed) {
      this.addElement(new TimeSignature(measure.staffDetails.time.value));
    }

    if (singleWholeRest) {
      // If just a single whole rest, make this spacer stretchable to "center" the rest
      this.addElement(Space.fromDimensions(4 * spacerWidth, spacerHeight), 1);
    } else {
      this.addElement(Space.fromDimensions(spacerWidth, spacerHeight));
    }

    for (const chord of measure.chords) {
      let width = widthForValue(chord.value);
      if (chord.rest) {
        this.addElement(new Rest(chord, part.lineCount));
      } else {
        const hasBend = chord.notes.some((n) => !!n.bend);
        width *= hasBend ? 2 : 1;
        this.addElement(new Chord(chord, part.lineCount));
      }

      if (singleWholeRest) {
        this.addElement(Space.fromDimensions(4 * spacerWidth, spacerHeight), 1);
      } else {
        this.addElement(Space.fromDimensions(width, spacerHeight), width);
      }
    }

    // TODO the spacing isn't perfect here. Sometimes the left chord is too close the barline, and sometimes the
    //      right-hand side is too close. Generally things look good, but sometimes it's unbalanced.

    // An empty spacer where, used to help us place the measure number
    this.addElement(Space.fromDimensions(0.5 * STAFF_LINE_HEIGHT, spacerHeight), 0);
  }

  override tryAddElement(element: LineElement, factor?: number) {
    const wasAdded = super.tryAddElement(element, factor);
    if (wasAdded) {
      if (element instanceof Rest || element instanceof Chord) {
        this.chords.push(element);
      }
      this.box.width += element.box.width;
    }
    return wasAdded;
  }

  override addElement(element: LineElement, factor?: number) {
    super.addElement(element, factor);
    if (element instanceof Rest || element instanceof Chord) {
      this.chords.push(element);
    }
    this.box.width += element.box.width;
  }
}

function widthForValue(value: NoteValue) {
  // TODO this 5 is kind of arbitrary, make it configurable?
  return Math.max(MIN_NOTE_WIDTH, QUARTER_NOTE_WIDTH * (5 * value.toDecimal()));
}
