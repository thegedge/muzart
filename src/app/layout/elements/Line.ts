import { clone, find, first, groupBy, isNumber, isUndefined, map, max, some } from "lodash";
import * as notation from "../../../notation";
import { AccentStyle, NoteValueName } from "../../../notation";
import { BEAM_HEIGHT, DOT_SIZE, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../constants";
import { AnchoredGroup } from "../layouts/AnchoredGroup";
import { FlexProps, LineElementFlexGroup } from "../layouts/FlexGroup";
import { Constraint as GridConstraint, GridGroup } from "../layouts/GridGroup";
import { Group } from "../layouts/Group";
import { NonNegativeGroup } from "../layouts/NonNegativeGroup";
import { Arc, Beam, Chord, DashedLineText, Dot, LineElement, Measure, Rest, Space, Stem, Text } from "../types";
import { minMap, runs } from "../utils";
import Box from "../utils/Box";

export class Line extends Group<LineElement> {
  private aboveStaffLayout: GridGroup<Text | DashedLineText | Space>;
  private staffLayout: LineElementFlexGroup;
  private belowStaffLayout: NonNegativeGroup<Stem | Beam | Dot>;

  // TODO find a better place for this
  private arcs: AnchoredGroup<Arc, Measure | Chord>;

  constructor(box: Box) {
    super(box);

    this.arcs = new AnchoredGroup();

    this.aboveStaffLayout = new GridGroup(STAFF_LINE_HEIGHT * 0.25);
    this.staffLayout = new LineElementFlexGroup({ box: clone(box), drawStaffLines: true }); // TODO eliminate drawStaffLines from here
    this.belowStaffLayout = new NonNegativeGroup();

    this.initializeElements();
  }

  addBarLine() {
    this.addElement(
      {
        type: "BarLine",
        box: new Box(0, 0.5 * STAFF_LINE_HEIGHT, LINE_STROKE_WIDTH, 5 * STAFF_LINE_HEIGHT),
        strokeSize: LINE_STROKE_WIDTH,
      },
      { factor: null }
    );
  }

  private initializeElements() {
    this.elements = [this.aboveStaffLayout, this.staffLayout, this.belowStaffLayout, this.arcs];

    this.addBarLine();

    const tabTextSize = (STAFF_LINE_HEIGHT * 4.5) / 3;
    const tabWidth = tabTextSize * 2;
    this.addElement(
      {
        type: "Group",
        box: new Box(0, 0.75 * STAFF_LINE_HEIGHT, tabWidth, STAFF_LINE_HEIGHT * 5),
        elements: [
          {
            type: "Text",
            box: new Box(0, 0, tabWidth, tabTextSize),
            align: "center",
            size: tabTextSize,
            value: "T",
            style: { userSelect: "none" },
          },
          {
            type: "Text",
            box: new Box(0, 1 * tabTextSize, tabWidth, tabTextSize),
            align: "center",
            size: tabTextSize,
            value: "A",
            style: { userSelect: "none" },
          },
          {
            type: "Text",
            box: new Box(0, 2 * tabTextSize, tabWidth, tabTextSize),
            align: "center",
            size: tabTextSize,
            value: "B",
            style: { userSelect: "none" },
          },
        ],
      },
      { factor: null }
    );
  }

  addElement(element: LineElement, flexProps?: Partial<FlexProps>) {
    return this.staffLayout.addElement(element, flexProps);
  }

  tryAddElement(element: LineElement, flexProps?: Partial<FlexProps>) {
    return this.staffLayout.tryAddElement(element, flexProps);
  }

  layout() {
    this.staffLayout.layout(true);
    this.staffLayout.box.height = max(map(this.staffLayout.elements, "box.height"));
    this.layOutArcs();

    // TODO have to reset everything in these two functions because layout() could be called multiple times. Some ideas to avoid this:
    //   1. Track whether or not the line is dirty, and then reset.
    //   2. Add the elements to the above/below staff layout once, but move them around.
    //   3. Constraint-based layouts (measure number is above the staff, anchored to the leftmost chord)
    this.addAboveStaffElements();
    this.addBelowStaffElements();

    // Finalize positions
    let y = 0;
    for (const element of this.elements.slice(0, -1)) {
      element.box.y = y;
      y += element.box.height;
    }

    this.arcs.box.y = this.staffLayout.box.y;

    this.box.width = max(map(this.elements, "box.width"));
    this.box.height = y;
  }

  private addBelowStaffElements() {
    this.belowStaffLayout.reset();
    for (const lineChild of this.staffLayout.elements) {
      if (lineChild.type !== "Measure") {
        continue;
      }
      this.stemAndBeam(lineChild);
    }
    this.belowStaffLayout.layout();
  }

  private addAboveStaffElements() {
    this.aboveStaffLayout.reset();

    // TODO figure out some place for this (size of palm mute text)
    const baseSize = 0.8 * STAFF_LINE_HEIGHT;

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => some(chord.notes, "palmMute"),
      () => ({
        type: "DashedLineText",
        box: new Box(0, 0, baseSize, baseSize),
        size: baseSize,
        value: "P.M.",
      })
    );

    this.addInterMeasureStaffDecorations<string>(
      (chord: notation.Chord) => {
        return find(chord.notes, "harmonic")?.harmonicString;
      },
      (harmonicString: string) => ({
        type: "DashedLineText",
        box: new Box(0, 0, baseSize, baseSize),
        size: baseSize,
        value: harmonicString,
      })
    );

    this.addIntraMeasureAboveStaffDecorations();

    const edges = this.gridLayoutElements().map(({ element, measure }) => measure.box.x + element.box.x);
    this.aboveStaffLayout.setRightEdges(edges);
    this.aboveStaffLayout.layout();
  }

  private addInterMeasureStaffDecorations<T>(
    predicate: (chord: notation.Chord) => T | undefined,
    elementGenerator: (value: T) => Text | DashedLineText | Space
  ) {
    // TODO the endColumn goes to the end of the chord box, but we probably only want it to go to the end of part of the chord
    //      box that contains the notes, not including the spacing at the right.

    let predicateValue: T | undefined;
    let startIndex: number | undefined;
    let endIndex = 0;
    this.gridLayoutElements().forEach(({ element }, index) => {
      if (element.type !== "Chord") {
        return;
      }

      const newPredicateValue = predicate(element.chord);
      if (newPredicateValue) {
        if (isUndefined(startIndex)) {
          startIndex = index + 1;
          predicateValue = newPredicateValue;
        }
      } else if (isNumber(startIndex)) {
        this.aboveStaffLayout.addElement(elementGenerator(predicateValue!), {
          startColumn: startIndex,
          endColumn: endIndex,
        });
        startIndex = undefined;
        predicateValue = undefined;
      }

      endIndex = index + 1;
    });

    if (isNumber(startIndex)) {
      this.aboveStaffLayout.addElement(elementGenerator(predicateValue!), {
        startColumn: startIndex,
        endColumn: endIndex,
      });
    }
  }

  private addIntraMeasureAboveStaffDecorations() {
    const numberSize = 0.08;
    const tempoSize = 0.12; // TODO property of this class? Related to staff line height?
    const baseSize = 0.8 * STAFF_LINE_HEIGHT;

    const elementsByMeasure = groupBy(
      this.gridLayoutElements().map(({ element, measure }, index) => ({ element, measure, index })),
      "measure.measure.number"
    );

    let firstMeasure = true;
    for (const measureElements of Object.values(elementsByMeasure)) {
      const measureStartColumn = minMap(measureElements, ({ index }) => index + 1) ?? 0;
      const measure = measureElements[0].measure.measure;

      this.aboveStaffLayout.addElement(
        {
          type: "Text",
          align: firstMeasure ? "left" : "center",
          box: new Box(0, 0, numberSize, numberSize),
          size: numberSize,
          value: measure.number.toString(),
          style: {
            userSelect: "none",
            fill: "#888888",
          },
        },
        {
          mustBeBottomRow: true,
          startColumn: measureStartColumn - 1,
          endColumn: measureStartColumn,
        }
      );

      for (const { element, index } of measureElements) {
        if (element.type !== "Chord") {
          continue;
        }

        const constraint: GridConstraint = {
          startColumn: index + 1,
          endColumn: index + 1,
        };

        if (element.chord.text) {
          // TODO baseSize isn't an appropriate width, but we have no way to measure text :(
          this.aboveStaffLayout.addElement(
            {
              type: "Text",
              box: new Box(0, 0, baseSize, baseSize),
              size: baseSize,
              value: element.chord.text,
              style: {
                fontStyle: "italic",
              },
            },
            constraint
          );
        }

        const accentuatedNote = find(element.chord.notes, "accent");
        if (accentuatedNote && accentuatedNote.accent) {
          let accentString;
          switch (accentuatedNote.accent) {
            case AccentStyle.Accentuated:
              accentString = "𝆓";
              break;
            case AccentStyle.Marcato:
              accentString = "᭴";
              break;
          }

          const accentSize = baseSize * 1.5;
          this.aboveStaffLayout.addElement(
            {
              type: "Text",
              box: new Box(element.box.x, 0, accentSize, accentSize),
              size: accentSize,
              value: accentString,
            },
            constraint
          );
        }
      }

      if (measure.staffDetails.tempo?.changed) {
        this.aboveStaffLayout.addElement(
          {
            type: "Text",
            align: "left",
            box: new Box(0, 0, 0, tempoSize),
            size: tempoSize,
            value: `♩﹦${measure.staffDetails.tempo.value}`,
            style: {
              userSelect: "none",
              fontWeight: "bold",
            },
          },
          {
            startColumn: measureStartColumn,
            endColumn: measureStartColumn + 1,
          }
        );

        if (measure.marker) {
          this.aboveStaffLayout.addElement(
            {
              type: "Text",
              box: new Box(0, 0, 0, baseSize),
              size: baseSize,
              value: measure.marker.text,
              style: {
                fontWeight: "bold",
                fill: measure.marker.color,
              },
            },
            {
              startColumn: measureStartColumn,
              endColumn: measureStartColumn + 1,
            }
          );
        }
      }

      firstMeasure = false;
    }
  }

  private stemAndBeam(measureElement: Measure) {
    const beats = this.groupElementsOnBeat(measureElement.measure, measureElement.elements);
    for (const beat of beats) {
      const firstElement = first(beat);
      if (!firstElement) {
        continue;
      }

      this.layOutStems(measureElement.box, beat);
      this.layOutBeams(measureElement.box, beat);
      this.layOutDots(measureElement.box, beat);
    }
  }

  private numBeams(element: Chord | Rest) {
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
    }
  }

  private elementOffset(element: Chord | Rest) {
    if (element.type === "Chord" && element.notes.length > 0) {
      return element.box.x + element.notes[0].box.centerX;
    }
    // TODO need to figure out how to best center in a rest
    return element.box.x + 0.4 * STAFF_LINE_HEIGHT;
  }

  // TODO there's a lot of "behavioural coupling" between these methods. For example, `layOutBeams` is aware of how tall
  //      stems are, and similarly for `layOutDots`.

  /**
   * Get the elements that influence the grid layout used for above staff decorations.
   *
   * Note that these establish the right edges of the columns. That means that the column in the grid group that corresponds
   * to the element in the array we return is actually one more than the index of that element.
   */
  private gridLayoutElements() {
    const elements = [];
    for (const measure of this.staffLayout.elements) {
      if (measure.type !== "Measure") {
        continue;
      }

      for (const measureChild of measure.elements) {
        elements.push({
          element: measureChild,
          measure,
        });
      }
    }
    return elements;
  }

  private layOutArcs() {
    this.arcs.reset();
    this.arcs.box = clone(this.staffLayout.box);

    // TODO unfortunate to have to do this `as`, but we want to make the `forEach` function below simpler by only considering chords
    const chords = this.gridLayoutElements().filter(({ element }) => element.type === "Chord") as {
      element: Chord;
      measure: Measure;
    }[];

    chords.forEach(({ element, measure }, index) => {
      for (const note of element.chord.notes) {
        // If the very first chord in the line has a tie, create an arc to show that
        if (note.tie?.previous && index === 0) {
          this.arcs.addElement(
            {
              type: "Arc",
              box: new Box(
                measure.box.x,
                measure.box.y + element.box.y + STAFF_LINE_HEIGHT * (note.placement?.string || 1),
                0.16,
                STAFF_LINE_HEIGHT * 0.5
              ),
              orientation: "below",
            },
            null
          );
        }

        if (note.tie?.nextChord) {
          // Find the chord
          let tieEnd: { element: Chord; measure: Measure } | undefined;
          for (let endIndex = index + 1; endIndex < chords.length; ++endIndex) {
            if (chords[endIndex].element.chord == note.tie.nextChord) {
              tieEnd = chords[endIndex];
              break;
            }
          }

          const offset = 0.08;

          let x;
          if (note.tie.type == "start") {
            x = measure.box.x + element.box.x + offset;
          } else {
            x = measure.box.x + element.box.x + offset - 0.05;
          }

          let width = 0;
          if (tieEnd) {
            width = tieEnd.element.box.x + tieEnd.measure.box.x - x + offset - 0.03;
          } else {
            width = this.staffLayout.box.right - measure.box.x - element.box.x - offset - 0.03;
          }

          this.arcs.addElement(
            {
              type: "Arc",
              box: new Box(
                x,
                measure.box.y + element.box.y + STAFF_LINE_HEIGHT * (note.placement?.string || 1),
                width,
                STAFF_LINE_HEIGHT * 0.5
              ),
              orientation: "below",
            },
            null
          );
        }
      }
    });
  }

  private layOutStems(measureBox: Box, beatElements: (Chord | Rest)[]) {
    for (const beatElement of beatElements) {
      if (beatElement.type !== "Chord") {
        continue;
      }

      if (beatElement?.chord.value.name === NoteValueName.Whole) {
        continue;
      }

      // Half notes have a shorter stem on tablature
      const y = this.numBeams(beatElement) < 0 ? STAFF_LINE_HEIGHT * 2 : STAFF_LINE_HEIGHT;
      const bottom = STAFF_LINE_HEIGHT * 3;

      this.belowStaffLayout.addElement({
        type: "Stem",
        box: new Box(measureBox.x + this.elementOffset(beatElement), y, beatElement.box.width, bottom - y),
      });
    }
  }

  private layOutDots(measureBox: Box, beatElements: (Chord | Rest)[]) {
    for (const beatElement of beatElements) {
      if (beatElement.chord.value.ndots > 0) {
        // TODO more than one dot
        // TODO rests have dot next to them

        // const y = STAFF_LINE_HEIGHT * 3 - BEAM_HEIGHT - (1.5 * BEAM_HEIGHT * this.numBeams(beatElement)) - BEAM_HEIGHT;
        let y = STAFF_LINE_HEIGHT * 3 - DOT_SIZE;
        const numBeams = this.numBeams(beatElement);
        if (numBeams > 0) {
          y -= BEAM_HEIGHT * this.numBeams(beatElement);
          y -= 0.5 * BEAM_HEIGHT * (this.numBeams(beatElement) - 1);
        }

        this.belowStaffLayout.addElement({
          type: "Dot",
          box: new Box(measureBox.x + this.elementOffset(beatElement), y, DOT_SIZE, DOT_SIZE),
        });
      }
    }
  }

  private layOutBeams(measureBox: Box, beatElements: (Chord | Rest)[]) {
    // TODO draw dots

    let y = STAFF_LINE_HEIGHT * 3 - BEAM_HEIGHT;
    const beamCounts = beatElements.map((element) => this.numBeams(element));
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

        this.belowStaffLayout.addElement({
          type: "Beam",
          box: new Box(left, y, right - left, BEAM_HEIGHT),
        });
      }

      // Decrement all the beam counts, since we just drew one. No worries about some going into the negatives.
      y -= 1.5 * BEAM_HEIGHT;
      beamCounts.forEach((_, index) => --beamCounts[index]);
    }
  }

  private groupElementsOnBeat(measure: notation.Measure, elements: (Chord | Rest | Space)[]) {
    let beatAmount = 0.25; // TODO What do default to? Currently assuming quarter beat, hence 0.25.
    const timeBeat = measure.staffDetails.time?.value?.toBeat();
    if (timeBeat) {
      beatAmount = timeBeat.value.toDecimal() * timeBeat.count;
    }

    // TODO determine if a general partition-y function is good here

    const beatElements = [];
    let currentBeatElements = [];
    let currentAmount = beatAmount;
    for (const measureChild of elements) {
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
