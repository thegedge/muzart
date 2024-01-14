import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

// TODO assuming a stringed + fretted instrument below. Will need to fix eventually.

export class DeleteNote extends Action {
  static readonly name = "Delete note";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "Delete";

  static actionForState(application: Application) {
    const instrument = application.selection.part?.part.instrument;
    const chord = application.selection.chord?.chord;
    const note = chord?.noteByString(application.selection.noteIndex + 1);
    return instrument && chord && note ? new DeleteNote(chord, note) : null;
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

  undo() {
    this.chord.changeNote(this.note);
  }
}
