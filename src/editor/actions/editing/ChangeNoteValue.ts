import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export const changeNoteValueAction = (value: notation.NoteValueName) => {
  return class ChangeNoteValue extends Action {
    static actionForState(application: Application) {
      const chord = application.selection.chord?.chord;
      return chord ? new ChangeNoteValue(chord, value) : null;
    }

    private previousValue: notation.NoteValueName;

    constructor(
      private chord: notation.Chord,
      private value: notation.NoteValueName,
    ) {
      super();
      this.previousValue = chord.value.name;
    }

    apply(_application: Application) {
      this.chord.setValue(this.chord.value.withName(this.value));
    }

    undo(_application: Application) {
      this.chord.setValue(this.chord.value.withName(this.previousValue));
    }
  };
};
