import * as notation from "../../notation";
import { Action } from "../state/Application";
import { withSelectionTracking } from "./withSelectionTracking";

type BooleanFeatures<T> = {
  [K in keyof T]: T[K] extends boolean | undefined ? K : never;
}[keyof T] &
  string;

export const toggleNoteFeature = (feature: BooleanFeatures<notation.NoteOptions>): Action => {
  let state: [notation.Chord, notation.Note];

  return withSelectionTracking({
    canApplyAction(application) {
      const chord = application.selection.chord?.chord;
      const note = application.selection.note?.note;
      return !!chord && !!note;
    },

    apply(application) {
      const chord = application.selection.chord?.chord;
      const note = application.selection.note?.note;
      if (!chord || !note) {
        return;
      }

      state = [chord, note];
      chord.changeNote(note.withChanges({ [feature]: !note[feature] }));
    },

    undo(_application) {
      state[0].changeNote(state[1]);
    },
  });
};
