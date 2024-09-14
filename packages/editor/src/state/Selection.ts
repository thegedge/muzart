import type { AllElements } from "@muzart/layout";
import * as layout from "@muzart/layout";
import { inRange, last, minBy } from "lodash-es";
import { makeAutoObservable } from "mobx";
import { StorableObject, numberOrDefault } from "../storage/Storage";

export class Selection implements StorableObject {
  public score: layout.Score | null = null;
  public partIndex = 0;
  public measureIndex = 0;
  public chordIndex = 0;
  public noteIndex = 0;

  constructor() {
    makeAutoObservable(this, undefined, { deep: false });
  }

  get part(): layout.Part | undefined {
    if (!this.score) {
      return;
    }

    const part = this.score.score.parts[this.partIndex];
    return this.score.children.find((element) => element.part == part);
  }

  get page(): layout.Page | undefined {
    const page = this.part?.children.find((p) => {
      const rangeStart = p.measures[0].measure.number;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- there's always at least one measure
      const rangeEnd = last(p.measures)!.measure.number + 1;
      return inRange(this.measureIndex + 1, rangeStart, rangeEnd);
    });
    if (!page) {
      throw new Error("current measure not found in any page");
    }
    return page;
  }

  get measure(): layout.Measure | undefined {
    return this.part?.measures[this.measureIndex];
  }

  get chord(): layout.Chord | layout.Rest | undefined {
    return this.measure?.chords[this.chordIndex];
  }

  get note(): layout.Note | undefined {
    if (this.chord?.type != "Chord") {
      return undefined;
    }

    // Need the `as` here because TS doesn't understand that the type check internally prevents returning anything else
    const noteIndex = this.chord.chord.notes.findIndex((note) => note.placement?.string == this.noteIndex + 1);
    return noteIndex == -1 ? undefined : this.chord.notes[noteIndex];
  }

  get element() {
    return this.note ?? this.chord ?? this.measure;
  }

  reset() {
    this.update({
      partIndex: 0,
      measureIndex: 0,
      chordIndex: 0,
      noteIndex: 0,
    });
  }

  update(selection: Partial<Pick<Selection, "partIndex" | "measureIndex" | "chordIndex" | "noteIndex">>) {
    const partIndex = selection.partIndex;
    const partChanged = partIndex != undefined && selection.partIndex != this.partIndex;
    if (partChanged) {
      this.partIndex = partIndex;
    }

    const measureIndex = selection.measureIndex;
    const measureChanged = measureIndex != undefined && selection.measureIndex != this.measureIndex;
    if (measureChanged) {
      this.measureIndex = measureIndex;
    }

    const chordIndex = selection.chordIndex;
    const chordChanged = chordIndex != undefined && selection.chordIndex != this.chordIndex;
    if (chordChanged) {
      this.chordIndex = chordIndex;
    }

    const noteIndex = selection.noteIndex;
    const noteChanged = noteIndex != undefined && selection.noteIndex != this.noteIndex;
    if (noteChanged) {
      this.noteIndex = noteIndex;
    }

    if (partChanged || measureChanged) {
      // So normally we'd use `this.measure`, but when we change parts and have to reflow, the reflow is in an autorun, and mobx
      // reaction-y things are _scheduled_, so `this.score` hasn't properly been set up yet, and `this.part` will be undefined.
      const measure = this.score?.score.parts[this.partIndex]?.measures[this.measureIndex];
      if (measure) {
        if (this.chordIndex >= measure.chords.length) {
          this.chordIndex = 0;
          this.noteIndex = 0;
        }
      }
    }
  }

  previousPart() {
    if (this.partIndex > 0) {
      this.update({ partIndex: this.partIndex - 1 });
    }
  }

  nextPart() {
    if (!this.score) {
      return;
    }

    if (this.partIndex < this.score.score.parts.length - 1) {
      this.update({ partIndex: this.partIndex + 1 });
    }
  }

  previousPage() {
    if (!this.part) {
      return;
    }

    const pageIndex = this.part.children.findIndex((p) => this.page == p);
    const measureIndex = pageIndex <= 0 ? 0 : this.part.children[pageIndex - 1].measures[0].measure.number - 1;
    this.update({ measureIndex });
  }

  nextPage() {
    if (!this.part) {
      return;
    }

    const pageIndex = this.part.children.findIndex((p) => this.page == p);
    const measureIndex =
      pageIndex == this.part.children.length - 1
        ? this.part.measures.length - 1
        : this.part.children[pageIndex + 1].measures[0].measure.number - 1;
    this.update({ measureIndex });
  }

  previousMeasure() {
    if (this.measureIndex > 0) {
      this.update({ measureIndex: this.measureIndex - 1 });
    }
  }

  nextMeasure() {
    if (!this.part) {
      return;
    }

    if (this.measureIndex < this.part.part.measures.length - 1) {
      this.update({ measureIndex: this.measureIndex + 1 });
    }
  }

  previousChord() {
    if (this.chordIndex == 0) {
      if (this.measureIndex > 0) {
        const previousMeasure = this.part?.measures[this.measureIndex - 1];
        this.update({
          measureIndex: this.measureIndex - 1,
          chordIndex: (previousMeasure?.chords.length ?? 1) - 1,
        });
      }
    } else {
      this.update({ chordIndex: this.chordIndex - 1 });
    }
  }

  nextChord() {
    if (!this.measure || !this.part) {
      return;
    }

    if (this.chordIndex == this.measure.measure.chords.length - 1) {
      if (this.measureIndex < this.part.part.measures.length - 1) {
        this.update({
          measureIndex: this.measureIndex + 1,
          chordIndex: 0,
        });
      }
    } else {
      this.update({ chordIndex: this.chordIndex + 1 });
    }
  }

  previousNote() {
    if (!this.part) {
      return;
    }

    if (this.noteIndex > 0) {
      this.update({ noteIndex: this.noteIndex - 1 });
      return;
    }

    // Try to find the closest chord above us, if there's another line below us
    if (!this.chord) {
      return;
    }

    const currentPageLine = this.measure?.parent?.parent as layout.AllElements | null;
    if (currentPageLine?.type !== "PageLine") {
      return;
    }

    const pages = this.part.children;
    const lines = pages.flatMap((page) => page.lines);
    const currentPageLineIndex = lines.findIndex((line) => line === currentPageLine);
    if (currentPageLineIndex <= 0) {
      return;
    }

    const chordX = layout.toAncestorCoordinateSystem(this.chord).x;
    const nextLine = lines[currentPageLineIndex - 1];
    const nextLineChords = nextLine.measures.flatMap((measure) =>
      measure.chords.map((chord) => [measure, chord] as const),
    );
    const closestChordOnNextLine = minBy(nextLineChords, ([_, chord]) =>
      Math.abs(layout.toAncestorCoordinateSystem(chord).x - chordX),
    );
    if (closestChordOnNextLine) {
      this.update({
        measureIndex: closestChordOnNextLine[0].measure.number - 1,
        chordIndex: closestChordOnNextLine[0].chords.indexOf(closestChordOnNextLine[1]),
        noteIndex: this.part.part.lineCount - 1,
      });
    }
  }

  nextNote() {
    if (!this.part) {
      return;
    }

    if (this.noteIndex < this.part.part.lineCount - 1) {
      this.update({ noteIndex: this.noteIndex + 1 });
      return;
    }

    // Try to find the closest chord below us, if there's another line below us
    if (!this.chord) {
      return;
    }

    const currentPageLine = this.measure?.parent?.parent as AllElements | null;
    if (currentPageLine?.type !== "PageLine") {
      return;
    }

    const pages = this.part.children;
    const lines = pages.flatMap((page) =>
      page.content.children.filter((child): child is layout.PageLine => child.type === "PageLine"),
    );
    const currentPageLineIndex = lines.findIndex((line) => line === currentPageLine);
    if (currentPageLineIndex === -1 || currentPageLineIndex === lines.length - 1) {
      return;
    }

    const chordX = layout.toAncestorCoordinateSystem(this.chord).x;
    const nextLine = lines[currentPageLineIndex + 1];
    const nextLineChords = nextLine.measures.flatMap((measure) =>
      measure.chords.map((chord) => [measure, chord] as const),
    );
    const closestChordOnNextLine = minBy(nextLineChords, ([_, chord]) =>
      Math.abs(layout.toAncestorCoordinateSystem(chord).x - chordX),
    );
    if (closestChordOnNextLine) {
      this.update({
        measureIndex: closestChordOnNextLine[0].measure.number - 1,
        chordIndex: closestChordOnNextLine[0].chords.indexOf(closestChordOnNextLine[1]),
        noteIndex: 0,
      });
    }
  }

  setFor(element: layout.AllElements) {
    // TODO optimize getting indexes (context?)
    const noteElement = layout.getAncestorOfType<layout.Note>(element, "Note");
    const chordElement = layout.getAncestorOfType<layout.Chord>(noteElement ?? element, "Chord");
    const measureElement = layout.getAncestorOfType<layout.Measure>(chordElement ?? element, "Measure");

    this.update({
      measureIndex: measureElement ? measureElement.measure.number - 1 : undefined,
      chordIndex:
        chordElement && measureElement
          ? measureElement.measure.chords.findIndex((n) => Object.is(n, chordElement.chord))
          : undefined,
      noteIndex: noteElement && noteElement.note.placement ? noteElement.note.placement.string - 1 : undefined,
    });
  }

  setScore(score: layout.Score | null) {
    this.score = score;

    if (score == null) {
      // This forces an update in `this.update` below
      this.partIndex = -1;
      this.measureIndex = -1;
      this.chordIndex = -1;
      this.noteIndex = -1;

      this.update({
        partIndex: 0,
        measureIndex: 0,
        chordIndex: 0,
        noteIndex: 0,
      });
    }
  }

  toJSON() {
    return {
      partIndex: this.partIndex,
      measureIndex: this.measureIndex,
      chordIndex: this.chordIndex,
      noteIndex: this.noteIndex,
    };
  }

  fromJSON(value: Record<string, unknown>): void {
    this.partIndex = numberOrDefault(value.partIndex, 0);
    this.measureIndex = numberOrDefault(value.measureIndex, 0);
    this.chordIndex = numberOrDefault(value.chordIndex, 0);
    this.noteIndex = numberOrDefault(value.noteIndex, 0);
  }
}
