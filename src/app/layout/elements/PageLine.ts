import { clone, find, first, groupBy, isNumber, isUndefined, map, max, range, some } from "lodash";
import * as notation from "../../../notation";
import { AccentStyle, NoteValueName } from "../../../notation";
import { BEAM_HEIGHT, DOT_SIZE, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../constants";
import { AnchoredGroup } from "../layouts/AnchoredGroup";
import { FlexGroupElement, FlexProps } from "../layouts/FlexGroup";
import { GridGroup } from "../layouts/GridGroup";
import { Group } from "../layouts/Group";
import { NonNegativeGroup } from "../layouts/NonNegativeGroup";
import { Chord, Line, LineElement, Measure, Rest, Space, Text } from "../types";
import { minMap, runs } from "../utils";
import Box from "../utils/Box";

export class PageLine extends Group<LineElement> {
  private aboveStaffLayout: GridGroup<LineElement>;
  private staffLayout: FlexGroupElement<LineElement>;
  private belowStaffLayout: NonNegativeGroup<LineElement>;

  // TODO find a better place for these
  private staffOverlay: AnchoredGroup<LineElement, Measure | Chord>;

  private staffLines: Line[] = [];

  constructor(box: Box, private numStaffLines = 6) {
    super(box);

    this.staffOverlay = new AnchoredGroup();

    this.aboveStaffLayout = new GridGroup(STAFF_LINE_HEIGHT * 0.25);
    this.staffLayout = new FlexGroupElement<LineElement>({ box: clone(box) });
    this.belowStaffLayout = new NonNegativeGroup();

    this.initializeElements();
  }

  addBarLine() {
    this.addElement(
      {
        type: "BarLine",
        box: new Box(
          0,
          0.5 * STAFF_LINE_HEIGHT,
          LINE_STROKE_WIDTH,
          ((this.numStaffLines || 6) - 1) * STAFF_LINE_HEIGHT
        ),
        strokeSize: LINE_STROKE_WIDTH,
      },
      { factor: null }
    );
  }

  private initializeElements() {
    this.addBarLine();

    const tabTextSize = 0.25 * this.numStaffLines * STAFF_LINE_HEIGHT;
    const tabWidth = 3 * STAFF_LINE_HEIGHT;
    const tabGroup = new FlexGroupElement<Text | Space>({
      box: new Box(0, 0.5 * STAFF_LINE_HEIGHT, tabWidth, STAFF_LINE_HEIGHT * (this.numStaffLines - 1)),
      axis: "vertical",
    });

    tabGroup.addElement({
      type: "Space",
      box: new Box(0, 0, tabWidth, LINE_STROKE_WIDTH),
    });

    tabGroup.addElement(
      {
        type: "Text",
        box: new Box(0, 0, tabWidth, tabTextSize),
        halign: "middle",
        size: tabTextSize,
        value: "T",
        style: { userSelect: "none" },
      },
      { factor: null }
    );

    tabGroup.addElement(
      {
        type: "Text",
        box: new Box(0, 0, tabWidth, tabTextSize),
        halign: "middle",
        size: tabTextSize,
        value: "A",
        style: { userSelect: "none" },
      },
      { factor: null }
    );

    tabGroup.addElement(
      {
        type: "Text",
        box: new Box(0, 0, tabWidth, tabTextSize),
        halign: "middle",
        size: tabTextSize,
        value: "B",
        style: { userSelect: "none" },
      },
      { factor: null }
    );

    tabGroup.addElement({
      type: "Space",
      box: new Box(0, 0, tabWidth, LINE_STROKE_WIDTH),
    });

    // Num staff lines doesn't change, so we can do this once and call it a day
    tabGroup.layout();

    this.addElement(tabGroup, { factor: null });

    this.staffLines = range(this.numStaffLines).map((_index) => ({
      type: "Line",
      box: new Box(0, 0, 0, 0),
      color: "#888888",
    }));

    this.elements = (this.staffLines as LineElement[]).concat([
      this.aboveStaffLayout,
      this.staffLayout,
      this.belowStaffLayout,
      this.staffOverlay,
    ]);
  }

  addElement(element: LineElement, flexProps?: Partial<FlexProps>) {
    return this.staffLayout.addElement(element, flexProps);
  }

  tryAddElement(element: LineElement, flexProps?: Partial<FlexProps>) {
    return this.staffLayout.tryAddElement(element, flexProps);
  }

  layout() {
    this.staffLayout.layout();
    this.staffLayout.box.height = max(map(this.staffLayout.elements, "box.height"));

    this.layOutStaffOverlay();

    // TODO have to reset everything in these two functions because layout() could be called multiple times. Some ideas to avoid this:
    //   1. Track whether or not the line is dirty, and then reset.
    //   2. Add the elements to the above/below staff layout once, but move them around.
    //   3. Constraint-based layouts (measure number is above the staff, anchored to the leftmost chord)
    this.addAboveStaffElements();
    this.addBelowStaffElements();

    // Finalize positions
    this.staffLayout.box.y = this.aboveStaffLayout.box.bottom;
    this.belowStaffLayout.box.y = this.staffLayout.box.bottom;
    this.staffOverlay.box.y = this.staffLayout.box.y;

    this.staffLines.forEach((line, index) => {
      line.box.width = this.box.width;
      line.box.y = this.staffLayout.box.y + (index + 0.5) * STAFF_LINE_HEIGHT;
    });

    this.box.width = max(map(this.elements, "box.width"));
    this.box.height = this.belowStaffLayout.box.bottom;
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
    this.layOutBends();

    // TODO figure out some place for this (size of palm mute text)
    const baseSize = 0.8 * STAFF_LINE_HEIGHT;

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => some(chord.notes, "palmMute"),
      (_hasPalmMute: boolean, amount: number) => ({
        type: amount > 1 ? "DashedLineText" : "Text",
        box: new Box(0, 0, 0, baseSize),
        size: baseSize,
        value: "P.M.",
      }),
      {
        group: "dashies",
      }
    );

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => {
        return find(chord.notes, "harmonic")?.harmonicString;
      },
      (harmonicString: string, amount: number) => ({
        type: amount > 1 ? "DashedLineText" : "Text",
        box: new Box(0, 0, 0, baseSize),
        size: baseSize,
        value: harmonicString,
      }),
      {
        group: "dashies",
      }
    );

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => some(chord.notes, "letRing"),
      (_letRing: boolean, amount: number) => ({
        type: amount > 1 ? "DashedLineText" : "Text",
        box: new Box(0, 0, 0, baseSize),
        size: baseSize,
        value: "let ring",
      }),
      {
        group: "dashies",
      }
    );

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => some(chord.notes, "vibrato"),
      (_vibrato: boolean, _amount: number) => ({
        type: "Vibrato",
        box: new Box(0, 0, 0, baseSize),
      }),
      {
        group: "vibrato",
        includeChordSpacer: true,
      }
    );

    this.addIntraMeasureAboveStaffDecorations();

    const edges = this.gridLayoutElements().map(({ element, measure }) => measure.box.x + element.box.x);
    this.aboveStaffLayout.setRightEdges(edges);
    this.aboveStaffLayout.layout();
  }

  private addInterMeasureStaffDecorations<T>(
    predicate: (chord: notation.Chord) => T | undefined,
    elementGenerator: (value: T, amount: number) => LineElement,
    options?: {
      group?: string;
      includeChordSpacer?: boolean;
    }
  ) {
    // TODO the endColumn goes to the end of the chord box, but we probably only want it to go to the end of part of the chord
    //      box that contains the notes, not including the spacing at the right.

    let predicateValue: T | undefined;
    let startIndex: number | undefined;
    let endIndex = 0;
    let amount = 0;
    this.gridLayoutElements().forEach(({ element, measure }, index) => {
      if (element.type === "Space") {
        return;
      }

      let newPredicateValue;
      if (element.type === "Chord") {
        newPredicateValue = predicate(element.chord);
      }

      if (newPredicateValue) {
        if (isUndefined(startIndex)) {
          startIndex = index + 1;
          predicateValue = newPredicateValue;
        } else {
          amount += 1;
        }
      } else if (isNumber(startIndex)) {
        this.aboveStaffLayout.addElement(elementGenerator(predicateValue!, amount), {
          startColumn: startIndex,
          endColumn: endIndex,
        });

        startIndex = undefined;
        predicateValue = undefined;
        amount = 0;
      }

      endIndex = index + (options?.includeChordSpacer ? 2 : 1);
    });

    if (isNumber(startIndex)) {
      this.aboveStaffLayout.addElement(elementGenerator(predicateValue!, amount), {
        startColumn: startIndex,
        endColumn: endIndex,
        group: options?.group,
      });
    }
  }

  private addIntraMeasureAboveStaffDecorations() {
    const numberSize = 0.08;
    const tempoSize = 0.1;
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
          halign: firstMeasure ? "start" : "middle",
          valign: "end",
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
            {
              startColumn: index + 1,
              endColumn: index + 1,
              group: "lyricsAndText",
            }
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
            {
              startColumn: index + 1,
              endColumn: index + 1,
            }
          );
        }
      }

      if (measure.staffDetails.tempo?.changed) {
        this.aboveStaffLayout.addElement(
          {
            type: "Text",
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

  private layOutBends() {
    this.gridLayoutElements().forEach(({ element }, index) => {
      if (element.type !== "Chord" || !element.chord) {
        return;
      }

      for (const note of element.chord.notes) {
        if (note.bend) {
          this.aboveStaffLayout.addElement(
            {
              type: "Bend",
              box: new Box(0, 0, 0, 2.5 * STAFF_LINE_HEIGHT),
              bend: note.bend,
              descent: ((note.placement?.string || 1) - 0.5) * STAFF_LINE_HEIGHT,
            },
            {
              startColumn: index + 1,
              // TODO if a note tie, should go to the end
              endColumn: index + 2,
              mustBeBottomRow: true,
            }
          );
        }
      }
    });
  }

  private layOutStaffOverlay() {
    this.staffOverlay.reset();
    this.staffOverlay.box = clone(this.staffLayout.box);
    this.layOutArcs();
    this.layOutSlides();
  }

  private layOutSlides() {
    const yoffset = LINE_STROKE_WIDTH * 3;
    const gridLayoutElements = this.gridLayoutElements();
    gridLayoutElements.forEach(({ element, measure }, index) => {
      if (element.type !== "Chord" || !element.chord) {
        return;
      }

      for (const note of element.chord.notes) {
        if (note.slide) {
          let x, w;
          switch (note.slide.type) {
            case notation.SlideType.ShiftSlide:
            case notation.SlideType.LegatoSlide:
              x = measure.box.x + element.box.right;
              // TODO this doesn't deal with crossing barlines
              w = gridLayoutElements[index + 1].element.box.width;
              break;
            case notation.SlideType.SlideIntoFromAbove:
            case notation.SlideType.SlideIntoFromBelow:
              w = STAFF_LINE_HEIGHT;
              x = measure.box.x + element.box.x - w;
              break;
            case notation.SlideType.SlideOutDownwards:
            case notation.SlideType.SlideOutUpwards:
              x = measure.box.x + element.box.right;
              w = STAFF_LINE_HEIGHT;
              break;
          }

          this.staffOverlay.addElement(
            {
              type: "Slide",
              box: new Box(
                x,
                measure.box.y + element.box.y + STAFF_LINE_HEIGHT * ((note.placement?.string || 1) - 1) + yoffset,
                w,
                STAFF_LINE_HEIGHT - 2 * yoffset
              ),
              upwards: note.slide.upwards,
            },
            null
          );
        }
      }
    });
  }

  private layOutArcs() {
    // TODO unfortunate to have to do this `as`, but we want to make the `forEach` function below simpler by only considering chords
    const chords = this.gridLayoutElements().filter(({ element }) => element.type === "Chord") as {
      element: Chord;
      measure: Measure;
    }[];

    chords.forEach(({ element, measure }, index) => {
      for (const note of element.chord.notes) {
        // If the very first chord in the line has a tie, create an arc to show that
        if (note.tie?.previous && index === 0) {
          this.staffOverlay.addElement(
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
          let tieEnd: { element: Chord; measure: Measure } | undefined;
          for (let endIndex = index + 1; endIndex < chords.length; ++endIndex) {
            if (chords[endIndex].element.chord == note.tie.nextChord) {
              tieEnd = chords[endIndex];
              break;
            }
          }

          const x = measure.box.x + element.box.centerX;
          let width;
          if (tieEnd) {
            width = tieEnd.measure.box.x + tieEnd.element.box.centerX - x;
          } else {
            width = this.staffLayout.box.right - x;
          }

          this.staffOverlay.addElement(
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

  // TODO there's a lot of "behavioural coupling" between these methods. For example, `layOutBeams` is aware of how tall
  //      stems are, and similarly for `layOutDots`.

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
