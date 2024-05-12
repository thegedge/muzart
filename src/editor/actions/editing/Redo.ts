import { Application } from "../../state/Application";
import { Action } from "../Action";

export class Redo extends Action {
  static readonly name = "Redo";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "$mod + Shift + z";

  static actionForState(_application: Application) {
    return new Redo();
  }

  apply(application: Application) {
    application.redo();
  }
}
