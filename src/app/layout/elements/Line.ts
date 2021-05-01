import { clone, find, first, isNumber, isUndefined, map, max } from "lodash";
import * as notation from "../../../notation";
import { AccentStyle, NoteValueName } from "../../../notation";
import { BEAM_HEIGHT, DOT_SIZE, STAFF_LINE_HEIGHT } from "../constants";
import { AnchoredGroup } from "../layouts/AnchoredGroup";
import { FlexProps, LineElementFlexGroup } from "../layouts/FlexGroup";
import { Constraint as GridConstraint, GridGroup } from "../layouts/GridGroup";
import { NonNegativeGroup } from "../layouts/NonNegativeGroup";
import { Arc, Beam, Chord, DashedLineText, Dot, LineElement, Measure, Rest, Space, Stem, Text } from "../types";
import { runs } from "../utils";
import Box from "../utils/Box";

export class Line {
  readonly type: "Group" = "Group";
  readonly elements: LineElement[] = [];

  private aboveStaffLayout: GridGroup<Text | DashedLineText | Space>;
  private staffLayout: LineElementFlexGroup;
  private belowStaffLayout: NonNegativeGroup<Stem | Beam | Dot>;

  // TODO find a better place for this
  private arcs: AnchoredGroup<Arc, Measure | Chord>;

  constructor(readonly box: Box) {
    this.arcs = new AnchoredGroup();

    this.aboveStaffLayout = new GridGroup(STAFF_LINE_HEIGHT * 0.25);
    this.staffLayout = new LineElementFlexGroup({ box: clone(box), drawStaffLines: true }); // TODO eliminate drawStaffLines from here
    this.belowStaffLayout = new NonNegativeGroup();

    this.elements.push(this.aboveStaffLayout, this.staffLayout, this.belowStaffLayout, this.arcs);
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

    // TODO have to reset everything because layout() could be called multiple times. This sucks though. Some ideas:
    //   1. Track whether or not the line is dirty, and then reset.
    //   2. Add the elements to the above/below staff layout once, but move them around.
    //   3. Constraint-based layouts (measure number is above the staff, anchored to the leftmost chord)
    this.aboveStaffLayout.reset();
    this.belowStaffLayout.reset();

    const rightEdges: number[] = [];
    for (const lineChild of this.staffLayout.elements) {
      if (lineChild.type !== "Measure") {
        continue;
      }

      this.addAboveStaffDecorationsForMeasure(rightEdges, lineChild);
      this.stemAndBeam(lineChild);
    }

    this.addAboveStaffDecorations();

    this.aboveStaffLayout.setRightEdges(rightEdges);
    this.aboveStaffLayout.layout();
    this.belowStaffLayout.layout();
    this.layOutArcs();

    // Finalize positions
    let y = 0;
    for (const element of this.elements.slice(0, -1)) {
      element.box.y = y;
      y += element.box.height;
    }

    this.box.width = max(map(this.elements, "box.width"));
    this.box.height = y;
  }

  private addAboveStaffDecorations() {
    const baseSize = 0.8 * STAFF_LINE_HEIGHT;

    let index = 0;
    let startIndex: number | undefined;
    let endIndex = 0;
    for (const lineElement of this.staffLayout.elements) {
      if (lineElement.type !== "Measure") {
        continue;
      }

      for (const measureElement of lineElement.elements) {
        index += 1;
        if (measureElement.type !== "Chord") {
          continue;
        }

        const palmMuteNote = find(measureElement.chord.notes, "palmMute");
        if (palmMuteNote) {
          if (isUndefined(startIndex)) {
            startIndex = index;
          }
        } else if (isNumber(startIndex)) {
          const constraint: GridConstraint = {
            startColumn: startIndex,
            endColumn: endIndex,
          };

          this.aboveStaffLayout.addElement(
            {
              type: "DashedLineText",
              box: new Box(0, 0, baseSize, baseSize),
              size: baseSize,
              value: "P.M.",
              // style: {
              //   fill: "#888888",
              // },
            },
            constraint
          );

          startIndex = undefined;
        }

        endIndex = index;
      }
    }

    if (isNumber(startIndex)) {
      const constraint: GridConstraint = {
        startColumn: startIndex,
        endColumn: endIndex,
      };

      this.aboveStaffLayout.addElement(
        {
          type: "DashedLineText",
          box: new Box(0, 0, baseSize, baseSize),
          size: baseSize,
          value: "P.M.",
          // style: {
          //   fill: "#888888",
          // },
        },
        constraint
      );
    }
  }

  private addAboveStaffDecorationsForMeasure(rightEdges: number[], measureElement: Measure) {
    const numberSize = 0.08;
    const tempoSize = 0.1; // TODO property of this class? Related to staff line height?
    const baseSize = 0.8 * STAFF_LINE_HEIGHT;

    let columnIndex = rightEdges.length;
    const startColumn = columnIndex;

    this.aboveStaffLayout.addElement(
      {
        type: "Text",
        align: "center",
        box: new Box(0, 0, numberSize, numberSize),
        size: numberSize,
        value: measureElement.measure.number.toString(),
        style: {
          userSelect: "none",
          fill: "#888888",
        },
      },
      {
        mustBeBottomRow: true,
        startColumn: columnIndex,
        endColumn: columnIndex + (rightEdges.length == 0 ? 0 : 1),
      }
    );

    for (const element of measureElement.elements) {
      columnIndex += 1;
      rightEdges.push(measureElement.box.x + element.box.x);

      if (element.type !== "Chord") {
        continue;
      }

      const constraint: GridConstraint = {
        startColumn: columnIndex,
        endColumn: columnIndex,
      };

      if (element.type === "Chord") {
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

        const harmonicNote = find(element.chord.notes, "harmonic");
        if (harmonicNote) {
          this.aboveStaffLayout.addElement(
            {
              type: "Text",
              box: new Box(0, 0, baseSize, baseSize),
              size: baseSize,
              value: harmonicNote.harmonicString,
              style: {
                fill: "#888888",
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
    }

    if (measureElement.measure.marker) {
      this.aboveStaffLayout.addElement(
        {
          type: "Text",
          box: new Box(0, 0, baseSize, baseSize),
          size: baseSize,
          value: measureElement.measure.marker.text,
          style: {
            fontWeight: "bold",
            fill: measureElement.measure.marker.color,
          },
        },
        {
          startColumn: startColumn + 1,
          endColumn: startColumn + 2,
        }
      );
    }

    if (measureElement.measure.staffDetails.tempo?.changed) {
      this.aboveStaffLayout.addElement(
        {
          type: "Text",
          align: "left",
          box: new Box(0, 0, measureElement.box.width, 2 * tempoSize),
          size: tempoSize,
          value: `♩﹦${measureElement.measure.staffDetails.tempo.value}`,
          style: {
            userSelect: "none",
            fontWeight: "bold",
          },
        },
        {
          startColumn: startColumn,
          endColumn: startColumn + 1,
        }
      );
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

  private chordElements() {
    return this.staffLayout.elements.flatMap((measure) => {
      if (measure.type !== "Measure") {
        return [];
      }

      const chords: Chord[] = [];
      for (const measureChild of measure.elements) {
        if (measureChild.type === "Chord") {
          chords.push(measureChild);
        }
      }

      return chords.map((chord) => ({
        chord,
        measure,
      }));
    });
  }

  private layOutArcs() {
    this.arcs.reset();
    this.arcs.box = this.staffLayout.box;

    const chords = this.chordElements();
    chords.forEach(({ chord, measure }, index) => {
      for (const note of chord.chord.notes) {
        // If the very first chord in the line has a tie, create an arc to show that
        if (note.tie?.previous && index === 0) {
          this.arcs.addElement(
            {
              type: "Arc",
              box: new Box(
                measure.box.x,
                measure.box.y + chord.box.y + STAFF_LINE_HEIGHT * (note.placement?.string || 1),
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
          let tieEnd: { chord: Chord; measure: Measure } | undefined;
          for (let endIndex = index + 1; endIndex < chords.length; ++endIndex) {
            if (chords[endIndex].chord.chord == note.tie.nextChord) {
              tieEnd = chords[endIndex];
              break;
            }
          }

          const offset = 0.08;

          let x;
          if (note.tie.type == "start") {
            x = measure.box.x + chord.box.x + offset;
          } else {
            x = measure.box.x + chord.box.x + offset - 0.05;
          }

          let width = 0;
          if (tieEnd) {
            width = tieEnd.chord.box.x + tieEnd.measure.box.x - x + offset - 0.03;
          } else {
            width = this.staffLayout.box.right - measure.box.x - chord.box.x - offset - 0.03;
          }

          this.arcs.addElement(
            {
              type: "Arc",
              box: new Box(
                x,
                measure.box.y + chord.box.y + STAFF_LINE_HEIGHT * (note.placement?.string || 1),
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
