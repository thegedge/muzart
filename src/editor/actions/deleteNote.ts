import * as notation from "../../notation";
import { Action } from "../state/Application";
import { withSelectionTracking } from "./withSelectionTracking";

export const deleteNote = (): Action => {
  let state: [notation.Chord, notation.Note | undefined];

  // TODO assuming a stringed + fretted instrument below. Will need to fix eventually.

  return withSelectionTracking({
    canApplyAction(application) {
      const instrument = application.selection.part?.part.instrument;
      const chord = application.selection.chord?.chord;
      const note = chord?.noteByString(application.selection.noteIndex + 1);
      return !!(instrument && chord && note);
    },

    apply(application) {
      const chord = application.selection.chord?.chord;
      if (!chord) {
        return;
      }

      const string = application.selection.noteIndex + 1;
      const note = chord.noteByString(string);
      if (note) {
        chord.removeNote(note);
      }

      state = [chord, note];
    },

    undo(_application) {
      const [chord, oldNote] = state;
      if (oldNote) {
        chord.changeNote(oldNote.options);
      }
    },
  });
};
