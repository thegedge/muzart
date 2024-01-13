import { Application } from "../../state/Application";
import { Action } from "../Action";

export class TogglePlayback extends Action {
  static actionForState(_application: Application) {
    return new TogglePlayback();
  }

  apply(application: Application) {
    application.playback.togglePlay();
  }
}
