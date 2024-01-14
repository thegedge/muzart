import { Application } from "../../state/Application";
import { Action } from "../Action";

export class PreviousNote extends Action {
  static readonly name = "Previous note";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "ArrowUp";

  static actionForState(_application: Application) {
    return new PreviousNote();
  }

  apply(application: Application) {
    application.selection.previousNote();
  }
}
