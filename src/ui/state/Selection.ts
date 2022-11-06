/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { inRange, last } from "lodash";
import { makeAutoObservable } from "mobx";
import layout, { Chord, getAncestorOfType, LayoutElement, Measure, Note, Page, Part, Rest, Score } from "../../layout";

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
    return this.score?.children[this.partIndex];
  }

  get page(): Page | undefined {
    return this.part?.children.find((p) =>
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

    // Need the `as` here because TS doesn't understand that the type check internally prevents returning anything else
    return this.chord?.children.find(
      (note) => note.type == "Note" && note.note.placement?.string == this.noteIndex + 1
    ) as Note | undefined;
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
          this.element = chord.children[this.noteIndex];
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

  previousChord() {
    if (this.chordIndex == 0) {
      if (this.measureIndex > 0) {
        this.measureIndex -= 1;
        this.chordIndex = (this.measure?.chords.length ?? 1) - 1;
        this.updateElement();
      }
    } else {
      this.chordIndex -= 1;
      this.updateElement();
    }
  }

  nextChord() {
    if (!this.measure || !this.part) {
      return;
    }

    if (this.chordIndex == this.measure.chords.length - 1) {
      const lastMeasureNumber = last(this.part.part.measures)?.number;
      if (!lastMeasureNumber) {
        return;
      }

      if (this.measureIndex < lastMeasureNumber) {
        this.measureIndex += 1;
        this.chordIndex = 0;
        this.updateElement();
      }
    } else {
      this.chordIndex += 1;
      this.updateElement();
    }
  }

  previousNote() {
    if (this.noteIndex > 0) {
      this.noteIndex -= 1;
      this.updateElement();
    }
  }

  nextNote() {
    if (!this.part) {
      return;
    }

    if (this.noteIndex < this.part.part.lineCount - 1) {
      this.noteIndex += 1;
      this.updateElement();
    }
  }

  setFor(element: layout.AllElements) {
    // TODO optimize getting indexes (context?)
    const noteElement = getAncestorOfType<Note>(element, "Note");
    const chordElement = getAncestorOfType<Chord>(noteElement ?? element, "Chord");
    const measureElement = getAncestorOfType<Measure>(chordElement ?? element, "Measure");

    this.update({
      measureIndex: measureElement ? measureElement.measure.number - 1 : undefined,
      chordIndex:
        chordElement && measureElement
          ? measureElement.measure.chords.findIndex((n) => Object.is(n, chordElement.chord))
          : undefined,
      noteIndex: noteElement && noteElement.note.placement ? noteElement.note.placement.string - 1 : undefined,
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

  private updateElement() {
    this.element = this.note;
    this.element ??= this.chord;
    this.element ??= this.measure;
  }
}
