import * as notation from "../../notation";
import { Application } from "../state/Application";
import { SelectionTrackingAction } from "./SelectionTrackingAction";

export type BooleanFeatures<T> = {
  [K in keyof T]: T[K] extends boolean | undefined ? K : never;
}[keyof T] &
  string;

export class ToggleNoteFeature extends SelectionTrackingAction {
  private state!: [notation.Chord, notation.Note];

  constructor(readonly feature: BooleanFeatures<notation.NoteOptions>) {
    super();
  }

  canApply(application: Application) {
    const chord = application.selection.chord?.chord;
    const note = application.selection.note?.note;
    return !!chord && !!note;
  }

  apply(application: Application) {
    super.apply(application);
    const chord = application.selection.chord?.chord;
    const note = application.selection.note?.note;
    if (!chord || !note) {
      return;
    }

    this.state = [chord, note];
    chord.changeNote(note.withChanges({ [this.feature]: !note[this.feature] }));
  }

  undo(application: Application) {
    super.undo(application);
    this.state[0].changeNote(this.state[1]);
  }
}
