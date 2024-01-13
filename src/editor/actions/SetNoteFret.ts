import * as notation from "../../notation";
import { Application } from "../state/Application";
import { Action } from "./Action";

// TODO assuming a stringed + fretted instrument below. Will need to fix eventually.

export const setNoteFretAction = (fret: number) => {
  return class SetNoteFret extends Action {
    static actionForState(application: Application) {
      const instrument = application.selection.part?.part.instrument;
      const chord = application.selection.chord?.chord;
      return instrument && chord ? new SetNoteFret(instrument, chord, application.selection.noteIndex + 1, fret) : null;
    }

    private note: notation.Note | undefined;
    private shouldPlayNote = true;

    private constructor(
      private instrument: notation.Instrument,
      private chord: notation.Chord,
      private string: number,
      private fret: number,
    ) {
      super();
      this.note = chord.noteByString(string);
    }

    apply(application: Application) {
      const tuning = this.instrument.tuning[this.string];

      let newNote: notation.Note;
      if (this.note) {
        newNote = this.note.withChanges({
          pitch: tuning.adjust(this.fret),
          placement: {
            string: this.string,
            fret: this.fret,
          },
          dead: undefined,
        });
      } else {
        newNote = new notation.Note({
          value: this.chord.value,
          pitch: tuning.adjust(this.fret),
          placement: {
            string: this.string,
            fret: this.fret,
          },
          dead: undefined,
        });
      }

      this.chord.changeNote(newNote);

      if (this.shouldPlayNote) {
        application.playback.playNote(newNote);
        this.shouldPlayNote = false;
      }
    }

    undo(_application: Application) {
      if (this.note) {
        this.chord.changeNote(this.note);
      } else {
        const note = this.chord.noteByString(this.string);
        if (note) {
          this.chord.removeNote(note);
        } else {
          // TODO throw error for "should never happen" in dev/test
        }
      }
    }
  };
};
