import { Application } from "../../state/Application";
import { Action } from "../Action";
import { AddChord } from "../editing/measure/AddChord";

export class NextChord extends Action {
  static readonly name = "Next chord";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "ArrowRight";

  static actionForState(_application: Application) {
    return new NextChord();
  }

  apply(application: Application) {
    const currentMeasure = application.selection.measure!.measure;

    // If we're at the last chord index in the measure, and it's invalid, create a new chord to help the
    // user work towards a valid measure
    if (application.selection.chordIndex == currentMeasure.chords.length - 1 && !currentMeasure.isValid) {
      application.dispatch(AddChord.actionForState(application));
    }

    application.selection.nextChord();
  }
}
