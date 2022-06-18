/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { head, inRange, last } from "lodash";
import { makeAutoObservable } from "mobx";
import { Chord, getAncestorOfType, LayoutElement, Measure, Note, Score } from "../../layout";

export class Selection {
  public score: Score | null = null;

  public part = 0;
  public measure = 0;
  public chord = 0;
  public note = 0;
  public element: LayoutElement<unknown> | undefined;

  constructor() {
    makeAutoObservable(this, undefined, { deep: false });
  }

  setScore(score: Score | null) {
    this.score = score;
    this.update({
      part: 0,
      measure: 0,
      chord: 0,
      note: 0,
    });
  }

  update(selection: Partial<Selection>) {
    const p = selection.part != undefined && selection.part != this.part;
    const m = selection.measure != undefined && selection.measure != this.measure;
    const c = selection.chord != undefined && selection.chord != this.chord;
    const n = selection.note != undefined && selection.note != this.note;
    const e = selection.element != this.element;

    if (p || m || c || n || e) {
      if (p) this.part = selection.part!;
      if (m) this.measure = selection.measure!;
      if (c) this.chord = selection.chord!;
      if (n) this.note = selection.note!;
      if (e) this.element = selection.element;
    }

    if (!this.element && this.score) {
      const part = this.score.parts[this.part];
      const measureIndex = this.measure;
      const page = part.pages.find((p) =>
        inRange(
          measureIndex + 1,
          head(p.measures)?.measure?.number ?? -1,
          (last(p.measures)?.measure?.number ?? -1) + 1
        )
      );

      if (page) {
        const measure = page.measures[this.measure];
        if (measure) {
          let chord = measure.chords[this.chord];
          if (!chord) {
            this.chord = 0;
            this.note = 0;
            chord = measure.chords[0];
          }

          if (chord.type == "Rest") {
            this.element = chord;
          } else {
            this.element = chord.notes[this.note];
          }
        }
      }
    }
  }

  setFor(element: LayoutElement) {
    // TODO optimize getting indexes (context?)
    const noteElement = getAncestorOfType<Note>(element, "Note");
    const chordElement = getAncestorOfType<Chord>(noteElement ?? element, "Chord");
    const measureElement = getAncestorOfType<Measure>(noteElement ?? chordElement ?? element, "Measure");

    this.update({
      measure: measureElement && measureElement.measure.number - 1,
      chord:
        chordElement &&
        measureElement &&
        measureElement.measure.chords.findIndex((n) => Object.is(n, chordElement.chord)),
      note: noteElement && chordElement && chordElement.notes.findIndex((n) => Object.is(n, noteElement)),
      element,
    });
  }
}
