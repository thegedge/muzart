import * as notation from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

export class IncreaseNoteValue extends Action {
  static readonly name = "Increase note value";
  static readonly defaultKeyBinding = "-";
  static readonly when = "editorFocused && !isPlaying";

  static actionForState(application: Application) {
    // TODO can't apply if duration at maximum
    const chord = application.selection.chord?.chord;
    return chord ? new IncreaseNoteValue(chord) : null;
  }

  private constructor(readonly chord: notation.Chord) {
    super();
  }

  apply(_application: Application) {
    this.chord.setValue(this.chord.value.increase());
  }

  undo(_application: Application) {
    this.chord.setValue(this.chord.value.decrease());
  }
}
