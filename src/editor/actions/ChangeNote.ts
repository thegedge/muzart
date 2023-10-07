import * as notation from "../../notation";
import { Application } from "../state/Application";
import { SelectionTrackingAction } from "./SelectionTrackingAction";

export class ChangeNote extends SelectionTrackingAction {
  private state!: [notation.Chord, notation.Note, notation.Note]; // chord, old, new

  constructor(readonly changes: Partial<notation.Note>) {
    super();
  }

  canApply(application: Application) {
    const chord = application.selection.chord;
    const note = application.selection.note;
    return !!(chord && note);
  }

  apply(application: Application) {
    super.apply(application);

    const chord = application.selection.chord?.chord;
    if (!chord) {
      return;
    }

    const note = application.selection.note?.note;
    if (!note) {
      return;
    }

    const newNote = note.withChanges(this.changes);
    const existing = chord.changeNote(newNote);

    // existing == note, maybe assert?

    this.state = [chord, existing!, newNote];
  }

  undo(application: Application) {
    super.undo(application);

    const [chord, oldNote, newNote] = this.state;
    if (oldNote) {
      chord.changeNote(oldNote);
    } else {
      chord.removeNote(newNote);
    }
  }
}
