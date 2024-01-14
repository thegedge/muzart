import { Application } from "../../state/Application";
import { Action } from "../Action";

export class EditDynamic extends Action {
  static readonly name = "Toggle edit dynamic";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "d";

  static actionForState(_application: Application) {
    return new EditDynamic();
  }

  apply(application: Application) {
    application.state.toggleEditingDynamic();
  }
}
