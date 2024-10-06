import * as notation from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

export class ChangeTimeSignature extends Action {
  static readonly name = "Change time signature";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = null;

  private oldTimeSignature: notation.Changeable<notation.TimeSignature> | undefined;

  constructor(
    private part: notation.Part,
    private measure: notation.Measure,
    private timeSignature: notation.TimeSignature | null,
  ) {
    super();
    this.oldTimeSignature = measure.staffDetails.time;
  }

  apply(_application: Application) {
    const measureIndex = this.part.measures.indexOf(this.measure);
    const previousTimeSignature = this.part.measures[measureIndex - 1]?.staffDetails.time?.value;
    if (!previousTimeSignature) {
      throw new Error("previous time signature not found");
    }

    if (this.timeSignature) {
      this.measure.setTimeSignature({
        value: this.timeSignature,
        changed: !this.timeSignature.isEqual(previousTimeSignature),
      });
    } else {
      this.measure.setTimeSignature({
        value: previousTimeSignature,
        changed: false,
      });
    }
  }

  undo(_application: Application) {
    this.measure.setTimeSignature(this.oldTimeSignature);
  }
}
