import { find, groupBy, isNumber, isUndefined, some } from "lodash";
import * as notation from "../../../notation";
import { AccentStyle } from "../../../notation";
import { BEAM_HEIGHT, chordWidth, STAFF_LINE_HEIGHT } from "../../constants";
import { GridGroup } from "../../layouts/GridGroup";
import { SimpleGroupElement } from "../../layouts/SimpleGroup";
import { LineElement, Measure } from "../../types";
import { Box, minMap } from "../../utils";
import { Beam } from "../Beam";
import { Bend } from "../Bend";
import { ChordDiagram } from "../ChordDiagram";
import { Stroke } from "../Stroke";
import { Text } from "../Text";
import { Vibrato } from "../Vibrato";

interface StaffElement {
  element: LineElement;
  measure: Measure;
}

export class AboveStaff extends GridGroup<LineElement> {
  /** If true, show chord diagrams in the above staff area. Otherwise, just show the name. */
  readonly showChordDiagrams = false;

  private staffElements: ReadonlyArray<StaffElement> = [];

  setStaffElements(staffElements: ReadonlyArray<StaffElement>) {
    this.staffElements = staffElements;
  }

  layout() {
    this.reset();

    this.layOutSimpleAboveStaffElements();
    this.layOutBends();

    const baseSize = 0.8 * STAFF_LINE_HEIGHT;

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => some(chord.notes, "palmMute"),
      (_hasPalmMute: boolean, amount: number) => ({
        type: amount > 1 ? "DashedLineText" : "Text",
        box: new Box(0, 0, 0, baseSize),
        size: baseSize,
        value: "P.M.",
        parent: null,
      })
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
        parent: null,
      })
    );

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => some(chord.notes, "letRing"),
      (_letRing: boolean, amount: number) => ({
        type: amount > 1 ? "DashedLineText" : "Text",
        box: new Box(0, 0, 0, baseSize),
        size: baseSize,
        value: "let ring",
        parent: null,
      })
    );

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => some(chord.notes, "vibrato"),
      (_vibrato: boolean, _amount: number) => new Vibrato(),
      {
        includeChordSpacer: true,
      }
    );

    this.addIntraMeasureAboveStaffDecorations();

    const edges = this.staffElements.map(({ element, measure }) => measure.box.x + element.box.x);
    this.setRightEdges(edges);
    super.layout();
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

    this.staffElements.forEach(({ element }, index) => {
      if (element.type == "Space") {
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
        if (predicateValue) {
          this.addElement(elementGenerator(predicateValue, amount), {
            startColumn: startIndex,
            endColumn: endIndex,
          });
        }

        startIndex = undefined;
        predicateValue = undefined;
        amount = 0;
      }

      endIndex = index + (options?.includeChordSpacer ? 2 : 1);
    });

    if (isNumber(startIndex) && predicateValue) {
      this.addElement(elementGenerator(predicateValue, amount), {
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
      this.staffElements.map(({ element, measure }, index) => ({ element, measure, index })),
      "measure.measure.number"
    );

    let firstMeasure = true;
    for (const measureElements of Object.values(elementsByMeasure)) {
      const measureStartColumn = minMap(measureElements, ({ index }) => index + 1) ?? 0;
      const measure = measureElements[0].measure.measure;

      this.addElement(
        new Text({
          value: measure.number.toString(),
          size: numberSize,
          halign: firstMeasure ? "start" : "center",
          valign: "end",
          style: {
            userSelect: "none",
            fill: "#888888",
          },
        }),
        {
          mustBeBottomRow: true,
          startColumn: measureStartColumn - 1, // this is the empty spacer at the end of the measure
          endColumn: measureStartColumn - 1,
        }
      );

      for (const { element, index } of measureElements) {
        if (element.type !== "Chord") {
          continue;
        }

        if (element.chord.chordDiagram) {
          if (this.showChordDiagrams) {
            const diagram = element.chord.chordDiagram;
            this.addElement(new ChordDiagram(diagram), {
              startColumn: index + 1,
              endColumn: index + 1,
              group: "chords",
            });
          } else {
            this.addElement(
              Text.centered({
                size: baseSize,
                value: element.chord.chordDiagram.name,
              }),
              {
                startColumn: index + 1,
                endColumn: index + 1,
                group: "chords",
              }
            );
          }
        }

        if (element.chord.text) {
          this.addElement(
            new Text({
              size: baseSize,
              value: element.chord.text,
              style: { fontStyle: "italic" },
            }),
            {
              startColumn: index + 1,
              endColumn: index + 2,
              group: "lyricsAndText",
            }
          );
        }

        const tremoloPickedNote = find(element.chord.notes, "tremoloPicking");
        if (tremoloPickedNote) {
          const beamBoxHeight = 3 * BEAM_HEIGHT;
          const gap = 0.5 * BEAM_HEIGHT;
          const width = 1.2 * chordWidth(1);
          const box = new Box(0, 0, width, beamBoxHeight + 2 * (BEAM_HEIGHT + gap));
          const group = new SimpleGroupElement<Beam>(box);

          // TODO are tremolo picks always three beams?
          for (let index = 0, y = 0; index < 3; y += 1.2 * BEAM_HEIGHT + gap, ++index) {
            group.addElement(new Beam(new Box(0, y, width, beamBoxHeight), 1.2 * BEAM_HEIGHT));
          }

          this.addElement(group, {
            startColumn: index + 1,
            endColumn: index + 1,
          });
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

          if (accentString) {
            const accentSize = baseSize * 1.5;
            this.addElement(new Text({ size: accentSize, value: accentString }), {
              startColumn: index + 1,
              endColumn: index + 1,
            });
          }
        }
      }

      if (measure.staffDetails.tempo?.changed) {
        this.addElement(
          new Text({
            size: tempoSize,
            value: `♩﹦${measure.staffDetails.tempo.value}`,
            style: {
              userSelect: "none",
              fontWeight: "bold",
            },
          }),
          {
            startColumn: measureStartColumn,
            endColumn: measureStartColumn + 1,
          }
        );

        if (measure.marker) {
          this.addElement(
            new Text({
              size: baseSize,
              value: measure.marker.text,
              style: {
                fontWeight: "bold",
                fill: measure.marker.color,
              },
            }),
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

  private layOutBends() {
    this.staffElements.forEach(({ element }, index) => {
      if (element.type !== "Chord" || !element.chord) {
        return;
      }

      for (const note of element.chord.notes) {
        if (note.bend) {
          this.addElement(new Bend(note.bend, note), {
            startColumn: index + 1,
            // TODO if a note tie, should go to the end of the tie
            endColumn: index + 2,
            mustBeBottomRow: true,
          });
        }
      }
    });
  }

  private layOutSimpleAboveStaffElements() {
    this.staffElements.forEach(({ element }, index) => {
      if (element.type !== "Chord" || !element.chord) {
        return;
      }

      if (element.chord.stroke) {
        // TODO this doesn't look right (too wide) when chord contains notes fretted at 10+. I don't think there's
        //  any straightforward way to deal with this right now, so just gonna deal with it.
        this.addElement(new Stroke(element.chord.stroke), {
          startColumn: index + 1,
          endColumn: index + 1,
          halign: "center",
          valign: "end",
        });
      }

      if (element.chord.tapped) {
        // TODO this doesn't look right (too wide) when chord contains notes fretted at 10+. I don't think there's
        //  any straightforward way to deal with this right now, so just gonna deal with it.
        this.addElement(
          new Text({
            box: new Box(0, 0, 0, STAFF_LINE_HEIGHT),
            size: STAFF_LINE_HEIGHT,
            value: "T",
            halign: "center",
          }),
          {
            startColumn: index + 1,
            endColumn: index + 1,
          }
        );
      }
    });
  }
}