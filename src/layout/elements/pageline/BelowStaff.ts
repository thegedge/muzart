import types, {
  BEAM_HEIGHT,
  Box,
  LINE_STROKE_WIDTH,
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
import { DecoratedText } from "../DecoratedText";
import { Dot, DOT_SIZE } from "../Dot";
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
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
      if (beatElement.type === "Rest") {
        continue;
      }

      if (beatElement.chord.value.name === NoteValueName.Whole) {
        continue;
      }

      // Half notes have a shorter stem on tablature
      const y = this.numBeams(beatElement) < 0 ? STAFF_LINE_HEIGHT * 2 : STAFF_LINE_HEIGHT;
      const stem = new Line(new Box(measureBox.x + beatElement.box.centerX, y, 0, STEM_HEIGHT - y));
      stem.style.stroke = STEM_BEAM_COLOR;
      this.addElement(stem);
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

        this.addElement(new Dot(measureBox.x + beatElement.box.centerX, y));
      }
    }
  }

  private layOutTuplets(measureBox: Box, beatElements: BeatElements[]) {
    const tupletValueForChord = (chord: notation.Chord) => {
      const tupletNote = chord.notes.find((n) => n.value.tuplet?.n);
      return tupletNote?.value.tuplet?.n;
    };

    const tupletRuns = runs(beatElements, (e) => tupletValueForChord(e.chord));
    for (const [start, end, tuplet] of tupletRuns) {
      const y = STEM_HEIGHT + BEAM_HEIGHT;
      const beatElement = beatElements[start];
      if (start == end) {
        this.addElement(
          Text.centered({
            box: new Box(measureBox.x + beatElement.box.x, y, beatElement.box.width, TUPLET_SIZE),
            value: String(tuplet),
            size: TUPLET_SIZE,
          }),
        );
      } else if (tuplet == end - start + 1 && tuplet == beatElements.length) {
        const width = beatElements[end].box.centerX - beatElement.box.centerX;
        this.addElement(
          Text.centered({
            box: new Box(measureBox.x + beatElement.box.centerX, y, width, TUPLET_SIZE),
            value: String(tuplet),
            size: TUPLET_SIZE,
          }),
        );
      } else {
        // TODO if end - start + 1 > tuplet, split up into multiple brackets groups
        const extensionWidth = 6 * LINE_STROKE_WIDTH;
        const width = beatElements[end].box.centerX - beatElement.box.centerX + extensionWidth;
        this.addElement(
          new DecoratedText(
            new Box(measureBox.x + beatElement.box.centerX - 0.5 * extensionWidth, y, width, TUPLET_SIZE),
            String(tuplet),
            TUPLET_SIZE,
            {
              start: { upTick: true },
              end: { upTick: true },
            },
          ),
        );
      }
    }
  }

  private layOutBeams(measureBox: Box, beatElements: BeatElements[]) {
    let y = STEM_HEIGHT - BEAM_HEIGHT;
    const beamCounts = beatElements.map((element) => this.numBeams(element));
    while (true) {
      // Find runs of elements that still need a beam drawn, then draw a beam between the two
      const beamRuns = runs(beamCounts, (v) => (v > 0 ? true : undefined));
      if (beamRuns.length === 0) {
        break;
      }

      // TODO if it's not the first iteration of the while(true), we probably need to draw single beam to the left
      //   if not the first in the beat, otherwise to the right

      for (const [start, end] of beamRuns) {
        let left = measureBox.x + beatElements[start].box.centerX;
        let right = measureBox.x + beatElements[end].box.centerX;
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
    const timeBeat = measure.staffDetails.time?.value.toBeat();
    if (timeBeat) {
      beatAmount = timeBeat.value.toDecimal() * timeBeat.count;
    }

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
}
