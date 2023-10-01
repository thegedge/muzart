import { Application } from "../state/Application";
import { SelectionTrackingAction } from "./SelectionTrackingAction";

export class DecreaseNoteValue extends SelectionTrackingAction {
  canApply(application: Application) {
    // TODO can't apply if duration at minimum
    const chord = application.selection.chord;
    return !!chord;
  }

  apply(application: Application) {
    super.apply(application);

    const chord = application.selection.chord?.chord;
    if (!chord) {
      return;
    }

    chord.setValue(chord.value.decrease());
  }

  undo(application: Application) {
    super.undo(application);

    const chord = application.selection.chord?.chord;
    if (!chord) {
      return;
    }

    chord.setValue(chord.value.increase());
  }
}
