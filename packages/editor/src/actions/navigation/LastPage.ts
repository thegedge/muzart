import { Application } from "../../state/Application";
import { Action } from "../Action";

export class LastPage extends Action {
  static readonly name = "Last page";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "End";

  static actionForState(_application: Application) {
    return new LastPage();
  }

  apply(application: Application) {
    const part = application.selection.part?.part;
    if (part) {
      application.selection.update({ measureIndex: part.measures.length - 1 });
    }
  }
}
