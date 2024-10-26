import * as notation from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";
import { CompositeAction } from "../../CompositeAction";
import { ToggleNoteTie } from "./ToggleNoteTie";

// TODO assuming a stringed + fretted instrument below. Will need to fix eventually.

export class DeleteNote extends Action {
  static readonly name = "Delete note";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "Delete";

  static actionForState(application: Application) {
    const instrument = application.selection.part?.part.instrument;
    const chord = application.selection.chord?.chord;
    const note = chord?.noteByString(application.selection.noteIndex + 1);
    if (!instrument || !chord || !note) {
      return null;
    }

    const deleteAction = new DeleteNote(chord, note);

    if (note.tie) {
      const toggleTie = ToggleNoteTie.actionForState(application);
      if (toggleTie) {
        // If there's a tie, we first need to remove it so all of the previous/next information isn't messed up
        return new CompositeAction(toggleTie, deleteAction);
      }
    }

    return deleteAction;
  }

  private constructor(
    private chord: notation.Chord,
    private note: notation.Note,
  ) {
    super();
  }

  apply(_application: Application) {
    this.chord.removeNote(this.note);
  }

  undo(_application: Application) {
    this.chord.changeNote(this.note);
  }
}
