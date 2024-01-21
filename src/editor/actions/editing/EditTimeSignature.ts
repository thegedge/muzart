import * as notation from "../../../notation";
import { narrowInstance } from "../../../utils/narrow";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export class EditTimeSignature extends Action {
  static readonly name = "Edit time signature";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = null;

  static actionForState(_application: Application) {
    return new EditTimeSignature();
  }

  static actionForContextMenu(application: Application) {
    const measure = narrowInstance(application.state.contextMenuSubject, notation.Measure);
    return measure ? new EditTimeSignature() : null;
  }

  apply(application: Application) {
    application.state.toggleEditingTimeSignature();
  }
}
