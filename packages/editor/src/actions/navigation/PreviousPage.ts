import { Application } from "../../state/Application";
import { Action } from "../Action";

export class PreviousPage extends Action {
  static readonly name = "Previous page";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "PageUp";

  static actionForState(_application: Application) {
    return new PreviousPage();
  }

  apply(application: Application) {
    application.selection.previousPage();
  }
}
