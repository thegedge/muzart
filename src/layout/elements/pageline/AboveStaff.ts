import * as notation from "../../../notation";
import { AccentStyle } from "../../../notation";
import { BEAM_HEIGHT, chordWidth, STAFF_LINE_HEIGHT } from "../../constants";
import { GridGroup } from "../../layouts/GridGroup";
import { SimpleGroupElement } from "../../layouts/SimpleGroup";
import { DecoratedText, LineElement, Measure } from "../../types";
import { Box } from "../../utils";
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
    const textElement = (text: string, amount: number): DecoratedText | Text => {
      if (amount > 1) {
        return {
          type: "DecoratedText",
          box: new Box(0, 0, 0, baseSize),
          size: baseSize,
          text,
          endDecoration: {
            downTick: true,
            upTick: true,
            dashed: true,
          },
          parent: null,
        };
      }

      return new Text({
        box: new Box(0, 0, 0, baseSize),
        size: baseSize,
        value: text,
        halign: "start",
        valign: "center",
      });
    };

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => chord.notes.some((n) => n.palmMute),
      (_hasPalmMute: boolean, amount: number) => textElement("P.M.", amount)
    );

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => {
        return chord.notes.find((n) => n.harmonic)?.harmonicString;
      },
      (harmonicString: string, amount: number) => textElement(harmonicString, amount)
    );

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => chord.notes.some((n) => n.letRing),
      (_letRing: boolean, amount: number) => textElement("let ring", amount)
    );

    this.addInterMeasureStaffDecorations(
      (chord: notation.Chord) => chord.notes.some((n) => n.vibrato),
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

    for (let index = 0; index < this.staffElements.length; ++index) {
      const element = this.staffElements[index].element;
      if (element.type == "Space") {
        continue;
      }

      let newPredicateValue;
      if (element.type === "Chord") {
        newPredicateValue = predicate(element.chord);
      }

      if (newPredicateValue) {
        if (startIndex === undefined) {
          startIndex = index + 1;
          predicateValue = newPredicateValue;
        } else {
          amount += 1;
        }
      } else if (typeof startIndex == "number") {
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
    }

    if (typeof startIndex == "number" && predicateValue) {
      this.addElement(elementGenerator(predicateValue, amount), {
        startColumn: startIndex,
        endColumn: endIndex,
        group: options?.group,
      });
    }
  }

  private addIntraMeasureAboveStaffDecorations() {
    const numberSize = 0.8 * STAFF_LINE_HEIGHT;
    const tempoSize = STAFF_LINE_HEIGHT;
    const baseSize = 0.8 * STAFF_LINE_HEIGHT;

    for (let index = 0; index < this.staffElements.length; ) {
      const measure = this.staffElements[index].measure.measure;

      this.addElement(
        new Text({
          value: measure.number.toString(),
          size: numberSize,
          halign: index == 0 ? "start" : "center",
          valign: "end",
          style: {
            userSelect: "none",
            color: "#888888",
            backgroundColor: "#ffffff",
          },
        }),
        {
          mustBeBottomRow: true,
          startColumn: index, // this is the empty spacer at the end of the measure
          endColumn: index + 1,
        }
      );

      if (measure.staffDetails.tempo?.changed) {
        this.addElement(
          new Text({
            size: tempoSize,
            value: `♩﹦${measure.staffDetails.tempo.value}`,
            style: {
              userSelect: "none",
              fontWeight: "bold",
              backgroundColor: "#ffffff",
            },
          }),
          {
            startColumn: index + 1,
            endColumn: index + 2,
          }
        );
      }

      if (measure.marker) {
        this.addElement(
          new Text({
            size: baseSize,
            value: measure.marker.text,
            style: {
              fontWeight: "bold",
              fill: measure.marker.color,
              backgroundColor: "#ffffff",
            },
          }),
          {
            startColumn: index + 1,
            endColumn: index + 2,
          }
        );
      }

      for (; index < this.staffElements.length; ++index) {
        const staffElement = this.staffElements[index];
        if (staffElement.measure.measure.number != measure.number) {
          break;
        }

        const element = staffElement.element;
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

        const tremoloPickedNote = element.chord.notes.find((n) => n.tremoloPicking);
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

        const accentuatedNote = element.chord.notes.find((n) => n.accent);
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
