import { Application } from "../../state/Application";
import { Action } from "../Action";

export class PreviousPart extends Action {
  static readonly name = "Previous part";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "Alt + $mod + ArrowUp";

  static actionForState(_application: Application) {
    return new PreviousPart();
  }

  apply(application: Application) {
    application.selection.previousPart();
  }
}
