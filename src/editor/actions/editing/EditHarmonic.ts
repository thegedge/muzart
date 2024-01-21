import { Note } from "../../../layout/elements/Note";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export class EditHarmonic extends Action {
  static readonly name = "Toggle edit harmonic";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "n";

  static actionForState(application: Application) {
    const note = application.selection.note;
    return note instanceof Note ? new EditHarmonic(note) : null;
  }

  constructor(readonly note: Note) {
    super();
  }

  apply(application: Application) {
    application.state.showModalFor(this.note, "note.harmonic");
  }
}
