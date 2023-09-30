import { Action } from "../state/Application";
import { withSelectionTracking } from "./withSelectionTracking";

export const decreaseNoteValue = (): Action => {
  // TODO support changing the duration of a selected note

  return withSelectionTracking({
    canApplyAction(application) {
      const chord = application.selection.chord;
      return !!chord;
    },

    apply(application) {
      const chord = application.selection.chord?.chord;
      if (!chord) {
        return;
      }

      chord.setValue(chord.value.decrease());
    },

    undo(application) {
      const chord = application.selection.chord?.chord;
      if (!chord) {
        return;
      }

      chord.setValue(chord.value.increase());
    },
  });
};
