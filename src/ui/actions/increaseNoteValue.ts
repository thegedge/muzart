import { Action } from "../state/Application";
import { withSelectionTracking } from "./withSelectionTracking";

export const increaseNoteValue = (): Action => {
  // TODO support changing the duration of a selected note

  return withSelectionTracking({
    apply(application) {
      const chord = application.selection.chord?.chord;
      if (!chord) {
        return;
      }

      chord.setValue(chord.value.increase());
    },

    undo(application) {
      const chord = application.selection.chord?.chord;
      if (!chord) {
        return;
      }

      chord.setValue(chord.value.decrease());
    },
  });
};
