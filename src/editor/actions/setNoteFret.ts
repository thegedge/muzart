import * as notation from "../../notation";
import { Action } from "../state/Application";
import { withSelectionTracking } from "./withSelectionTracking";

export const setNoteFret = (fret: number): Action => {
  let state: [notation.Chord, notation.Note | undefined, notation.Note]; // chord, existing, new

  // TODO assuming a stringed + fretted instrument below. Will need to fix eventually.

  return withSelectionTracking({
    canApplyAction(application) {
      const instrument = application.selection.part?.part.instrument;
      const chord = application.selection.chord?.chord;
      return !!(instrument && chord);
    },

    apply(application) {
      const instrument = application.selection.part?.part.instrument;
      const chord = application.selection.chord?.chord;
      if (!instrument || !chord) {
        return;
      }

      const string = application.selection.noteIndex + 1;
      const tuning = instrument.tuning[application.selection.noteIndex];
      const note = application.selection.note?.note;

      const options = {
        value: note?.value ?? chord.value,
        pitch: tuning.adjust(fret),
        placement: {
          string,
          fret,
        },
        dead: undefined,
      };

      const newNote = note ? note.withChanges(options) : new notation.Note(options);
      const existing = chord.changeNote(newNote);

      state = [chord, existing, newNote];
    },

    undo(_application) {
      const [chord, oldNote, newNote] = state;
      if (oldNote) {
        chord.changeNote(oldNote);
      } else {
        chord.removeNote(newNote);
      }
    },
  });
};
