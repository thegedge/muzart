import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ResetZoom extends Action {
  static readonly name = "Reset zoom";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "$mod + 0";

  static actionForState(_application: Application) {
    return new ResetZoom();
  }

  apply(application: Application) {
    application.canvas.setZoom(1);
    application.canvas.centerViewportOn();
  }
}
