import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export type BooleanFeatures<T> = {
  [K in keyof T]: T[K] extends boolean | undefined ? K : never;
}[keyof T] &
  string;

export const toggleNoteFeatureAction = (feature: BooleanFeatures<notation.NoteOptions>) => {
  return class ToggleNoteFeature extends Action {
    static actionForState(application: Application) {
      const chord = application.selection.chord?.chord;
      const note = application.selection.note?.note;
      return chord && note ? new ToggleNoteFeature(chord, note, feature) : null;
    }

    private constructor(
      private chord: notation.Chord,
      private note: notation.Note,
      private feature: BooleanFeatures<notation.NoteOptions>,
    ) {
      super();
    }

    apply(_application: Application) {
      this.chord.changeNote(this.note.withChanges({ [this.feature]: !this.note[this.feature] }));
    }

    undo(_application: Application) {
      this.chord.changeNote(this.note);
    }
  };
};
