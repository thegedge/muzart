import { Application } from "../../state/Application";
import { Action } from "../Action";

export class Undo extends Action {
  static readonly name = "Undo";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "$mod + z";

  static actionForState(_application: Application) {
    return new Undo();
  }

  apply(application: Application) {
    application.undo(application);
  }
}
