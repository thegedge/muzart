import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export const dotNoteAction = (dots: number) => {
  return class DotNote extends Action {
    static actionForState(application: Application) {
      const chord = application.selection.chord?.chord;
      const note = application.selection.note?.note;
      return chord && note ? new DotNote(chord, note, dots) : null;
    }

    private constructor(
      private chord: notation.Chord,
      private note: notation.Note,
      private dots: number,
    ) {
      super();
    }

    apply(_application: Application) {
      this.chord.changeNote(this.note.withChanges({ value: this.note.value.withDots(this.dots) }));
    }

    undo(_application: Application) {
      this.chord.changeNote(this.note);
    }
  };
};
