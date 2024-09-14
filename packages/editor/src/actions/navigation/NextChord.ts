import { Application } from "../../state/Application";
import { Action } from "../Action";
import { AddChord } from "../editing/chord/AddChord";
import { AddMeasure } from "../editing/measure/AddMeasure";

export class NextChord extends Action {
  static readonly name = "Next chord";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "ArrowRight";

  static actionForState(_application: Application) {
    return new NextChord();
  }

  apply(application: Application) {
    const currentMeasure = application.selection.measure?.measure;
    if (!currentMeasure) {
      return;
    }

    const selectionIsLastChordInMeasure = application.selection.chordIndex == currentMeasure.chords.length - 1;

    // If we're at the last chord index in the measure, and it's invalid, create a new chord to help the
    // user work towards a valid measure
    if (selectionIsLastChordInMeasure && !currentMeasure.isValid) {
      application.dispatch(AddChord.actionForState(application));
    }

    const part = application.selection.part?.part;
    if (part) {
      // If we're at the last chord of the last measure, create a new measure
      if (application.selection.measureIndex == part.measures.length - 1 && selectionIsLastChordInMeasure) {
        application.dispatch(AddMeasure.actionForState(application));
      }
    }

    application.selection.nextChord();
  }
}
