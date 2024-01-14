import { Application } from "../../state/Application";
import { Action } from "../Action";

export class EditBend extends Action {
  static readonly name = "Toggle edit bend";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "b";

  static actionForState(_application: Application) {
    return new EditBend();
  }

  apply(application: Application) {
    application.state.toggleEditingBend();
  }
}
