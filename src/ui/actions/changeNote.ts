import * as notation from "../../notation";
import { Action } from "../state/Application";
import { withSelectionTracking } from "./withSelectionTracking";

export const changeNote = (fret: number): Action => {
  let state: [notation.Chord, [notation.Note | undefined, notation.Note]];

  return withSelectionTracking({
    apply(application) {
      // TODO assuming a stringed + fretted instrument below. Will need to fix eventually.
      const instrument = application.selection.part?.part.instrument;
      const chord = application.selection.chord?.chord;
      if (!instrument || !chord) {
        return;
      }

      const string = application.selection.noteIndex + 1;
      const tuning = instrument.tuning[application.selection.noteIndex];
      const notes = chord.changeNote({
        pitch: tuning.adjust(fret),
        placement: {
          fret,
          string,
        },
        dead: undefined,
      });

      state = [chord, notes];
    },

    undo(_application) {
      const [chord, [oldNote, newNote]] = state;
      if (oldNote) {
        chord.changeNote(oldNote.options);
      } else if (newNote) {
        chord.removeNote(newNote);
      }
    },
  });
};
