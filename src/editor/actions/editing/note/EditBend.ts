import * as notation from "../../../../notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

export class EditBend extends Action {
  static readonly name = "Toggle edit bend";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "b";

  static actionForState(application: Application) {
    const note = application.selection.note?.note;
    return note ? new EditBend(note) : null;
  }

  constructor(readonly note: notation.Note) {
    super();
  }

  apply(application: Application) {
    application.state.showModalFor(this.note, "bend");
  }
}
