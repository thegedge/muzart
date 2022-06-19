/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { inRange, last } from "lodash";
import { makeAutoObservable } from "mobx";
import { Chord, getAncestorOfType, LayoutElement, Measure, Note, Page, Part, Rest, Score } from "../../layout";

export class Selection {
  public score: Score | null = null;

  public partIndex = 0;
  public measureIndex = 0;
  public chordIndex = 0;
  public noteIndex = 0;
  public element: LayoutElement | undefined;

  constructor() {
    makeAutoObservable(this, undefined, { deep: false });
  }

  get part(): Part | undefined {
    return this.score?.parts[this.partIndex];
  }

  get page(): Page | undefined {
    return this.part?.pages.find((p) =>
      inRange(
        this.measureIndex + 1,
        p.measures[0]?.measure?.number ?? -1,
        (last(p.measures)?.measure?.number ?? -1) + 1
      )
    );
  }

  get measure(): Measure | undefined {
    if (!this.page) {
      return;
    }

    const measureIndex = this.measureIndex - (this.page.measures[0]?.measure.number ?? -1) + 1;
    return this.page.measures[measureIndex];
  }

  get chord(): Chord | Rest | undefined {
    return this.measure?.chords[this.chordIndex];
  }

  get note(): Note | undefined {
    if (this.chord?.type != "Chord") {
      return undefined;
    }
    return this.chord?.notes[this.noteIndex];
  }

  update(selection: Partial<Selection>) {
    const p = selection.partIndex != undefined && selection.partIndex != this.partIndex;
    const m = selection.measureIndex != undefined && selection.measureIndex != this.measureIndex;
    const c = selection.chordIndex != undefined && selection.chordIndex != this.chordIndex;
    const n = selection.noteIndex != undefined && selection.noteIndex != this.noteIndex;
    const e = selection.element != this.element;

    if (p || m || c || n || e) {
      if (p) this.partIndex = selection.partIndex!;
      if (m) this.measureIndex = selection.measureIndex!;
      if (c) this.chordIndex = selection.chordIndex!;
      if (n) this.noteIndex = selection.noteIndex!;
      if (e) this.element = selection.element;
    }

    if (!this.element && this.score) {
      const measure = this.measure;
      if (measure) {
        let chord = measure.chords[this.chordIndex];
        if (!chord) {
          this.chordIndex = 0;
          this.noteIndex = 0;
          chord = measure.chords[0];
        }

        if (chord.type == "Rest") {
          this.element = chord;
        } else {
          this.element = chord.notes[this.noteIndex];
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
      measureIndex: measureElement && measureElement.measure.number - 1,
      chordIndex:
        chordElement &&
        measureElement &&
        measureElement.measure.chords.findIndex((n) => Object.is(n, chordElement.chord)),
      noteIndex: noteElement && chordElement && chordElement.notes.findIndex((n) => Object.is(n, noteElement)),
      element,
    });
  }

  setScore(score: Score | null) {
    this.score = score;
    this.update({
      partIndex: 0,
      measureIndex: 0,
      chordIndex: 0,
      noteIndex: 0,
    });
  }
}
