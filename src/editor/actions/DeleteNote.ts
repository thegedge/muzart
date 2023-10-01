import * as notation from "../../notation";
import { Application } from "../state/Application";
import { SelectionTrackingAction } from "./SelectionTrackingAction";

// TODO assuming a stringed + fretted instrument below. Will need to fix eventually.

export class DeleteNote extends SelectionTrackingAction {
  private state!: [notation.Chord, notation.Note | undefined];

  canApply(application: Application) {
    const instrument = application.selection.part?.part.instrument;
    const chord = application.selection.chord?.chord;
    const note = chord?.noteByString(application.selection.noteIndex + 1);
    return !!(instrument && chord && note);
  }

  apply(application: Application) {
    super.apply(application);

    const chord = application.selection.chord?.chord;
    if (!chord) {
      return;
    }

    const string = application.selection.noteIndex + 1;
    const note = chord.noteByString(string);
    if (note) {
      chord.removeNote(note);
    }

    this.state = [chord, note];
  }

  undo(application: Application) {
    super.undo(application);

    const [chord, oldNote] = this.state;
    if (oldNote) {
      chord.changeNote(oldNote);
    }
  }
}
