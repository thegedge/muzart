import { Application } from "../../state/Application";
import { Action } from "../Action";

export class NextMeasure extends Action {
  static readonly name = "Next measure";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "$mod + Shift + ArrowRight";

  static actionForState(_application: Application) {
    return new NextMeasure();
  }

  apply(application: Application) {
    application.selection.nextMeasure();
  }
}
