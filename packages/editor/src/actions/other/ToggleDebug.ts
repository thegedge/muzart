import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ToggleDebug extends Action {
  static readonly name = "Toggle debug";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "Shift + D";

  static actionForState(_application: Application) {
    return new ToggleDebug();
  }

  apply(application: Application) {
    application.debug.setEnabled(!application.debug.enabled);
  }
}
