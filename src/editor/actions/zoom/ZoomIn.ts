import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ZoomIn extends Action {
  static readonly name = "Zoom in";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "$mod + =";

  static actionForState(_application: Application) {
    return new ZoomIn();
  }

  apply(application: Application) {
    application.canvas.zoom(1.0 / 1.2);
  }
}
