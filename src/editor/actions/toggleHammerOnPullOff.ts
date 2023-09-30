import * as notation from "../../notation";
import { Action } from "../state/Application";
import { withSelectionTracking } from "./withSelectionTracking";

export const toggleHammerOnPullOff = (): Action => {
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
      chord.changeNote(note.withChanges({ hammerOnPullOff: !note.hammerOnPullOff }));
    },

    undo(_application) {
      state[0].changeNote(state[1]);
    },
  });
};
