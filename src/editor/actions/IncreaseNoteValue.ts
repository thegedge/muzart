import { Application } from "../state/Application";
import { SelectionTrackingAction } from "./SelectionTrackingAction";

export class IncreaseNoteValue extends SelectionTrackingAction {
  canApply(application: Application) {
    // TODO can't apply if duration at maximum
    const chord = application.selection.chord;
    return !!chord;
  }

  apply(application: Application) {
    super.apply(application);

    const chord = application.selection.chord?.chord;
    if (!chord) {
      return;
    }

    chord.setValue(chord.value.increase());
  }

  undo(application: Application) {
    super.undo(application);

    const chord = application.selection.chord?.chord;
    if (!chord) {
      return;
    }

    chord.setValue(chord.value.decrease());
  }
}
