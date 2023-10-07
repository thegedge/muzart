/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { inRange, last } from "lodash";
import { autorun, makeAutoObservable } from "mobx";
import layout, { getAncestorOfType, layOutScore } from "../../layout";
import * as notation from "../../notation";
import { StorableObject, SyncStorage, numberOrDefault } from "../storage/Storage";
import { VIEW_STATE_NAMESPACE, VIEW_STATE_SELECTION_SUBKEY } from "../storage/namespaces";

export class Selection implements StorableObject {
  public score: layout.Score | null = null;
  public partIndex = 0;
  public measureIndex = 0;
  public chordIndex = 0;
  public noteIndex = 0;

  private score_: notation.Score | null = null;
  private reflowDisposer: (() => void) | null = null;

  constructor(readonly storage: SyncStorage) {
    storage.loadObject(VIEW_STATE_NAMESPACE, VIEW_STATE_SELECTION_SUBKEY, this);
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
    const noteIndex = this.chord?.chord.notes.findIndex((note) => note.placement?.string == this.noteIndex + 1);
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
      // So normally we'd use `this.measure`, but when we change parts and have to reflow, the reflow is in an autorun, and mobx
      // reaction-y things are _scheduled_, so `this.score` hasn't properly been set up yet, and `this.part` will be undefined.
      const measure = this.score_?.parts[this.partIndex]?.measures[this.measureIndex];
      if (measure) {
        if (this.chordIndex >= measure.chords.length) {
          this.chordIndex = 0;
          this.noteIndex = 0;
        }
      }
    }

    if (partChanged || measureChanged || chordChanged || noteChanged) {
      this.storage.store(VIEW_STATE_NAMESPACE, VIEW_STATE_SELECTION_SUBKEY, this).catch(console.error);
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

    if (this.chordIndex == this.measure.chords.length - 1) {
      const lastMeasureNumber = last(this.part.part.measures)?.number;
      if (!lastMeasureNumber) {
        return;
      }

      if (this.measureIndex < lastMeasureNumber) {
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
    if (this.noteIndex > 0) {
      this.update({ noteIndex: this.noteIndex - 1 });
    }
  }

  nextNote() {
    if (!this.part) {
      return;
    }

    if (this.noteIndex < this.part.part.lineCount - 1) {
      this.update({ noteIndex: this.noteIndex + 1 });
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
    // On our first set, we don't want to override any state we loaded from storage
    const shouldUpdate = this.score_ != null;

    this.score_ = score;

    if (shouldUpdate) {
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
    } else {
      this.reflow();
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

  private reflow() {
    this.reflowDisposer?.();

    const score = this.score_;
    const partIndex = this.partIndex;
    if (score && partIndex >= 0) {
      this.reflowDisposer = autorun(() => {
        this.score = layOutScore(score, [partIndex]);
      });
    }
  }
}
