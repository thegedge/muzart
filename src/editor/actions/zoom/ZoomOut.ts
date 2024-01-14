import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ZoomOut extends Action {
  static readonly name = "Zoom out";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "$mod + -";

  static actionForState(_application: Application) {
    return new ZoomOut();
  }

  apply(application: Application) {
    application.canvas.setZoom(application.canvas.zoom / 1.2);
  }
}
