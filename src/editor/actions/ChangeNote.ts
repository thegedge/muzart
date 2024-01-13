import * as notation from "../../notation";
import { Application } from "../state/Application";
import { Action } from "./Action";

export const changeNoteAction = (changes: Partial<notation.Note>) => {
  return class ChangeNote extends Action {
    static actionForState(application: Application) {
      const chord = application.selection.chord?.chord;
      const note = application.selection.note?.note;
      return chord && note ? new ChangeNote(chord, note, changes) : null;
    }

    constructor(
      private chord: notation.Chord,
      private note: notation.Note,
      private changes: Partial<notation.Note>,
    ) {
      super();
    }

    apply(_application: Application) {
      this.chord.changeNote(this.note.withChanges(this.changes));
    }

    undo(_application: Application) {
      this.chord.changeNote(this.note);
    }
  };
};
