import { Note } from "@muzart/layout";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

export class EditDynamic extends Action {
  static readonly name = "Toggle edit dynamic";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "d";

  static actionForState(application: Application) {
    const note = application.selection.note;
    return note instanceof Note ? new EditDynamic(note) : null;
  }

  constructor(readonly note: Note) {
    super();
  }

  apply(application: Application) {
    application.state.showModalFor(this.note, "note.dynamic");
  }
}
