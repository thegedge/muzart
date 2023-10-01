/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { inRange, last } from "lodash";
import { autorun, makeAutoObservable } from "mobx";
import layout, { getAncestorOfType, layOutScore } from "../../layout";
import * as notation from "../../notation";
import { StorableObject, SyncStorage, numberOrDefault } from "../storage/Storage";
import { VIEW_STATE_NAMESPACE, VIEW_STATE_SELECTION_SUBKEY } from "../storage/namespaces";

export class Selection implements StorableObject {
  public score: layout.Score | null = null;
  private score_: notation.Score | null = null;
  private autorunDispose: (() => void) | null = null;

  public partIndex = 0;
  public measureIndex = 0;
  public chordIndex = 0;
  public noteIndex = 0;

  constructor(readonly storage: SyncStorage) {
    this.storage.loadObject(VIEW_STATE_NAMESPACE, VIEW_STATE_SELECTION_SUBKEY, this);
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
    return this.part?.children.find((p) =>
      inRange(
        this.measureIndex + 1,
        p.measures[0]?.measure?.number ?? -1,
        (last(p.measures)?.measure?.number ?? -1) + 1,
      ),
    );
  }

  get measure(): layout.Measure | undefined {
    if (!this.page) {
      return;
    }

    const measureIndex = this.measureIndex - (this.page.measures[0]?.measure.number ?? -1) + 1;
    return this.page.measures[measureIndex];
  }

  get chord(): layout.Chord | layout.Rest | undefined {
    return this.measure?.chords[this.chordIndex];
  }

  get note(): layout.Note | undefined {
    if (this.chord?.type != "Chord") {
      return undefined;
    }

    // Need the `as` here because TS doesn't understand that the type check internally prevents returning anything else
    const noteIndex = this.chord?.chord.notes.findIndex((note) => note.placement?.string == this.noteIndex + 1);
    return noteIndex == -1 ? undefined : this.chord.notes[noteIndex];
  }

  get element() {
    return this.note ?? this.chord ?? this.measure;
  }

  reset() {
    this.partIndex = 0;
    this.measureIndex = 0;
    this.chordIndex = 0;
    this.noteIndex = 0;
  }

  update(selection: Partial<Selection>) {
    const score = this.score_;
    if (!score) {
      return;
    }

    const partChanged = selection.partIndex != undefined && selection.partIndex != this.partIndex;
    if (partChanged) {
      this.partIndex = selection.partIndex!;
      this.reflow();
    }

    const measureChanged = selection.measureIndex != undefined && selection.measureIndex != this.measureIndex;
    if (measureChanged) {
      this.measureIndex = selection.measureIndex!;
    }

    const chordChanged = selection.chordIndex != undefined && selection.chordIndex != this.chordIndex;
    if (chordChanged) {
      this.chordIndex = selection.chordIndex!;
    }

    const noteChanged = selection.noteIndex != undefined && selection.noteIndex != this.noteIndex;
    if (noteChanged) {
      this.noteIndex = selection.noteIndex!;
    }

    if (partChanged || measureChanged) {
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

    if (partChanged || measureChanged || chordChanged || noteChanged) {
      void this.storage.store(VIEW_STATE_NAMESPACE, VIEW_STATE_SELECTION_SUBKEY, this);
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
    const noteElement = getAncestorOfType<layout.Note>(element, "Note");
    const chordElement = getAncestorOfType<layout.Chord>(noteElement ?? element, "Chord");
    const measureElement = getAncestorOfType<layout.Measure>(chordElement ?? element, "Measure");

    this.update({
      measureIndex: measureElement ? measureElement.measure.number - 1 : undefined,
      chordIndex:
        chordElement && measureElement
          ? measureElement.measure.chords.findIndex((n) => Object.is(n, chordElement.chord))
          : undefined,
      noteIndex: noteElement && noteElement.note.placement ? noteElement.note.placement.string - 1 : undefined,
    });
  }

  setScore(score: notation.Score | null) {
    this.score_ = score;

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

  private reflow() {
    this.autorunDispose?.();

    const score = this.score_;
    const partIndex = this.partIndex;
    if (score && partIndex >= 0) {
      this.autorunDispose = autorun(() => {
        this.score = layOutScore(score, [partIndex]);
      });
    }
  }
}
