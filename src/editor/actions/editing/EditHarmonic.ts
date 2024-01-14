import { Application } from "../../state/Application";
import { Action } from "../Action";

export class EditHarmonic extends Action {
  static readonly name = "Toggle edit harmonic";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "n";

  static actionForState(_application: Application) {
    return new EditHarmonic();
  }

  apply(application: Application) {
    application.state.toggleEditingHarmonic();
  }
}
