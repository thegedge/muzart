import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ToggleHelp extends Action {
  static readonly name = "Toggle help";
  static readonly when = "editorFocused && !editingBend";
  static readonly defaultKeyBinding = "Shift + ?";

  static actionForState(_application: Application) {
    return new ToggleHelp();
  }

  apply(application: Application) {
    application.state.toggleHelp();
  }
}
