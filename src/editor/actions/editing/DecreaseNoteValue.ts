import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export class DecreaseNoteValue extends Action {
  static readonly name = "Decrease note value";
  // TODO it would be nice to show this as just "+", but supporting that will be tricky because we can't just use `event.key`,
  //   otherwise we may accidentally call another action.
  static readonly defaultKeyBinding = "Shift + +";
  static readonly when = "editorFocused && !isPlaying";

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

  undo() {
    this.chord.setValue(this.chord.value.increase());
  }
}
