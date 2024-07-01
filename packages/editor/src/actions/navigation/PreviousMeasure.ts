import { Application } from "../../state/Application";
import { Action } from "../Action";

export class PreviousMeasure extends Action {
  static readonly name = "Previous measure";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "$mod + Shift + ArrowLeft";

  static actionForState(_application: Application) {
    return new PreviousMeasure();
  }

  apply(application: Application) {
    application.selection.previousMeasure();
  }
}
