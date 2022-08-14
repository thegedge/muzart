import types, {
  BEAM_HEIGHT,
  Box,
  DOT_SIZE,
  runs,
  STAFF_LINE_HEIGHT,
  STEM_BEAM_COLOR,
  STEM_HEIGHT,
  TUPLET_SIZE,
} from "../..";
import * as notation from "../../../notation";
import { NoteValueName } from "../../../notation";
import { SimpleGroupElement } from "../../layouts/SimpleGroup";
import { LineElement, Measure } from "../../types";
import { Beam } from "../Beam";
import { Dot } from "../Dot";
import { Line } from "../Line";
import { Text } from "../Text";

type BeatElements = types.Chord | types.Rest;

export class BelowStaff extends SimpleGroupElement<LineElement> {
  private measures: ReadonlyArray<Measure> = [];

  setMeasures(measures: ReadonlyArray<Measure>) {
    this.measures = measures;
  }

  layout(): void {
    this.reset();
    for (const measure of this.measures) {
      this.stemAndBeam(measure);
    }
    super.layout();
  }

  private stemAndBeam(measureElement: types.Measure) {
    const beats = this.groupElementsOnBeat(measureElement.measure, measureElement.children);
    for (const beat of beats) {
      const firstElement = beat[0];
      if (!firstElement) {
        continue;
      }

      this.layOutStems(measureElement.box, beat);
      this.layOutBeams(measureElement.box, beat);
      this.layOutDots(measureElement.box, beat);
      this.layOutTuplets(measureElement.box, beat);
    }
  }

  private numBeams(element: BeatElements) {
    switch (element.chord.value.name) {
      case NoteValueName.Whole:
        return -2;
      case NoteValueName.Half:
        return -1;
      case NoteValueName.Quarter:
        return 0;
      case NoteValueName.Eighth:
        return 1;
      case NoteValueName.Sixteenth:
        return 2;
      case NoteValueName.ThirtySecond:
        return 3;
      case NoteValueName.SixtyFourth:
        return 4;
      case NoteValueName.OneTwentyEighth:
        return 5;
    }
  }

  // TODO there's a lot of "behavioural coupling" between these methods. For example, `layOutBeams` is aware of how tall
  //      stems are, and similarly for `layOutDots`.

  private layOutStems(measureBox: Box, beatElements: BeatElements[]) {
    for (const beatElement of beatElements) {
      if (beatElement.type !== "Chord") {
        continue;
      }

      if (beatElement.chord.value.name === NoteValueName.Whole) {
        continue;
      }

      // Half notes have a shorter stem on tablature
      const y = this.numBeams(beatElement) < 0 ? STAFF_LINE_HEIGHT * 2 : STAFF_LINE_HEIGHT;
      const stemBox = new Box(measureBox.x + this.elementOffset(beatElement), y, 0, STEM_HEIGHT - y);

      this.addElement(new Line(stemBox, STEM_BEAM_COLOR));
    }
  }

  private layOutDots(measureBox: Box, beatElements: BeatElements[]) {
    for (const beatElement of beatElements) {
      if (beatElement.chord.value.dots > 0) {
        // TODO more than one dot
        // TODO rests have dot next to them

        // const y = STEM_SIZE - BEAM_HEIGHT - (1.5 * BEAM_HEIGHT * this.numBeams(beatElement)) - BEAM_HEIGHT;
        let y = STEM_HEIGHT - DOT_SIZE;
        const numBeams = this.numBeams(beatElement);
        if (numBeams > 0) {
          y -= BEAM_HEIGHT * this.numBeams(beatElement);
          y -= 0.5 * BEAM_HEIGHT * (this.numBeams(beatElement) - 1);
        }

        this.addElement(new Dot(measureBox.x + this.elementOffset(beatElement), y));
      }
    }
  }

  private layOutTuplets(measureBox: Box, beatElements: BeatElements[]) {
    // TODO "bracket" multiple notes in a row, e.g., └─ 3 ─┘. It's a little challenging though, because there are
    //  a lot of special cases:
    //     1. If the entire beat is the same tuplet value, and it's beamed, no bracketing
    //     2. Bracketing regardless if we're crossing a beat? Is it the entire set of n notes, or just what falls in the beat?

    for (const beatElement of beatElements) {
      const noteWithTuplet = beatElement.chord.notes.find((note) => !!note.value.tuplet);
      const tuplet = noteWithTuplet?.value.tuplet;
      if (tuplet) {
        const y = STEM_HEIGHT + BEAM_HEIGHT;
        this.addElement(
          Text.centered({
            box: new Box(measureBox.x + beatElement.box.x, y, beatElement.box.width, TUPLET_SIZE),
            value: String(tuplet.n),
            size: TUPLET_SIZE,
          })
        );
      }
    }
  }

  private layOutBeams(measureBox: Box, beatElements: BeatElements[]) {
    let y = STEM_HEIGHT - BEAM_HEIGHT;
    const beamCounts = beatElements.map((element) => this.numBeams(element));
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Find runs of elements that still need a beam drawn, then draw a beam between the two
      const beamRuns = runs(beamCounts, (v) => v > 0);
      if (beamRuns.length === 0) {
        break;
      }

      // TODO if it's not the first iteration of the while(true), we probably need to draw single beam to the left
      //   if not the first in the beat, otherwise to the right

      for (const [start, end] of beamRuns) {
        let left = measureBox.x + this.elementOffset(beatElements[start]);
        let right = measureBox.x + this.elementOffset(beatElements[end]);
        if (start === end) {
          if (start == 0) {
            right += 2 * BEAM_HEIGHT;
          } else {
            left -= 2 * BEAM_HEIGHT;
          }
        }

        this.addElement(new Beam(new Box(left, y, right - left, BEAM_HEIGHT)));
      }

      // Decrement all the beam counts, since we just drew one. No worries about some going into the negatives.
      y -= 1.5 * BEAM_HEIGHT;
      beamCounts.forEach((_, index) => --beamCounts[index]);
    }
  }

  private groupElementsOnBeat(measure: notation.Measure, line: LineElement[]) {
    let beatAmount = 0.25; // TODO What do default to? Currently assuming quarter beat, hence 0.25.
    const timeBeat = measure.staffDetails.time?.value?.toBeat();
    if (timeBeat) {
      beatAmount = timeBeat.value.toDecimal() * timeBeat.count;
    }

    // TODO determine if a general partition-y function is good here

    const beatElements = [];
    let currentBeatElements = [];
    let currentAmount = beatAmount;
    for (const measureChild of line) {
      if (measureChild.type !== "Chord") {
        continue;
      }

      const amount = measureChild.chord.value.toDecimal();
      currentAmount -= amount;

      // If there's no more the beat can give...
      if (currentAmount < 0) {
        while (currentAmount < 0) {
          currentAmount += beatAmount;
        }

        // If the note is bigger than a beat, make it its own beat
        if (currentBeatElements.length === 0) {
          currentBeatElements.push(measureChild);
        }

        beatElements.push(currentBeatElements);
        currentBeatElements = [];
      }

      currentBeatElements.push(measureChild);
    }

    if (currentBeatElements.length > 0) {
      beatElements.push(currentBeatElements);
    }

    return beatElements;
  }

  private elementOffset(element: BeatElements) {
    if (element.type === "Chord" && element.children.length > 0) {
      return element.box.x + element.children[0].box.centerX;
    }
    // TODO need to figure out how to best center in a rest
    return element.box.x + 0.4 * STAFF_LINE_HEIGHT;
  }
}
