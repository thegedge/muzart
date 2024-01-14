import { Application } from "../../state/Application";
import { Action } from "../Action";

export class PreviousChord extends Action {
  static readonly name = "Previous chord";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "ArrowLeft";

  static actionForState(_application: Application) {
    return new PreviousChord();
  }

  apply(application: Application) {
    application.selection.previousChord();
  }
}
