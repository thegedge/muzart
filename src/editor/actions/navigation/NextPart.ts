import { Application } from "../../state/Application";
import { Action } from "../Action";

export class NextPart extends Action {
  static readonly name = "Next part";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "Alt + $mod + ArrowDown";

  static actionForState(_application: Application) {
    return new NextPart();
  }

  apply(application: Application) {
    application.selection.nextPart();
  }
}
