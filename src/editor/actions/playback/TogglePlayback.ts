import { Application } from "../../state/Application";
import { Action } from "../Action";

export class TogglePlayback extends Action {
  static readonly name = "Toggle playback";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = " ";

  static actionForState(_application: Application) {
    return new TogglePlayback();
  }

  apply(application: Application) {
    application.playback.togglePlay();
  }
}
