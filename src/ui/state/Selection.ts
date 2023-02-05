/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { inRange, last } from "lodash";
import { makeAutoObservable } from "mobx";
import layout, { Chord, getAncestorOfType, Measure, Note, Page, Part, Rest, Score } from "../../layout";
import { VIEW_STATE_NAMESPACE } from "../storage/namespaces";
import { numberOrDefault, StorableObject, SyncStorage } from "../storage/Storage";

export class Selection implements StorableObject {
  public score: Score | null = null;

  public partIndex = 0;
  public measureIndex = 0;
  public chordIndex = 0;
  public noteIndex = 0;

  constructor(readonly storage: SyncStorage) {
    this.storage.loadObject(VIEW_STATE_NAMESPACE, "selection", this);
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

  get element() {
    return this.note ?? this.chord ?? this.measure;
  }

  update(selection: Partial<Selection>) {
    const p = selection.partIndex != undefined && selection.partIndex != this.partIndex;
    const m = selection.measureIndex != undefined && selection.measureIndex != this.measureIndex;
    const c = selection.chordIndex != undefined && selection.chordIndex != this.chordIndex;
    const n = selection.noteIndex != undefined && selection.noteIndex != this.noteIndex;

    if (p || m || c || n) {
      if (p) this.partIndex = selection.partIndex!;
      if (m) this.measureIndex = selection.measureIndex!;
      if (c) this.chordIndex = selection.chordIndex!;
      if (n) this.noteIndex = selection.noteIndex!;

      void this.storage.store(VIEW_STATE_NAMESPACE, "selection", this);
    }

    if (this.score) {
      const measure = this.measure;
      if (measure) {
        let chord = measure.chords[this.chordIndex];
        if (!chord) {
          this.chordIndex = 0;
          this.noteIndex = 0;
          chord = measure.chords[0];
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
    if (this.part) {
      const pageIndex = this.part.children.findIndex((p) => this.page == p);
      const measureIndex = pageIndex == 0 ? 0 : this.part.children[pageIndex - 1].measures[0].measure.number - 1;
      this.update({ measureIndex });
    }
  }

  nextPage() {
    if (this.part) {
      const pageIndex = this.part.children.findIndex((p) => this.page == p);
      const measureIndex =
        pageIndex == this.part.children.length - 1
          ? this.part.children[pageIndex].measures[0].measure.number - 1
          : this.part.children[pageIndex + 1].measures[0].measure.number - 1;

      this.update({ measureIndex });
    }
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
        this.measureIndex -= 1;
        this.chordIndex = (this.measure?.chords.length ?? 1) - 1;
      }
    } else {
      this.chordIndex -= 1;
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
      }
    } else {
      this.chordIndex += 1;
    }
  }

  previousNote() {
    if (this.noteIndex > 0) {
      this.noteIndex -= 1;
    }
  }

  nextNote() {
    if (!this.part) {
      return;
    }

    if (this.noteIndex < this.part.part.lineCount - 1) {
      this.noteIndex += 1;
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
    });
  }

  setScore(score: Score | null) {
    this.score = score;
    this.update({
      partIndex: this.partIndex,
      measureIndex: this.measureIndex,
      chordIndex: this.chordIndex,
      noteIndex: this.noteIndex,
    });
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
