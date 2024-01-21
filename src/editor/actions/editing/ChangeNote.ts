import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export const changeNoteAction = (changes: Partial<notation.Note>) => {
  return class ChangeNote extends Action {
    static readonly name = "Change note";
    static readonly when = "editorFocused";
    static readonly defaultKeyBinding = null;

    static actionForState(application: Application) {
      const note = application.selection.note?.note;
      return note ? new ChangeNote(note, changes) : null;
    }

    constructor(
      private note: notation.Note,
      private changes: Partial<notation.Note>,
    ) {
      super();
    }

    apply(_application: Application) {
      this.note.chord.changeNote(this.note.withChanges(this.changes));
    }

    undo() {
      this.note.chord.changeNote(this.note);
    }
  };
};
