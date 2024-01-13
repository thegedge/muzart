import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export class DecreaseNoteValue extends Action {
  static actionForState(application: Application) {
    // TODO can't apply if duration at maximum
    const chord = application.selection.chord?.chord;
    return chord ? new DecreaseNoteValue(chord) : null;
  }

  private constructor(readonly chord: notation.Chord) {
    super();
  }

  apply(_application: Application) {
    this.chord.setValue(this.chord.value.decrease());
  }

  undo(_application: Application) {
    this.chord.setValue(this.chord.value.increase());
  }
}
