import { Application } from "../../state/Application";
import { Action } from "../Action";

export class FirstPage extends Action {
  static readonly name = "First page";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "Home";

  static actionForState(_application: Application) {
    return new FirstPage();
  }

  apply(application: Application) {
    application.selection.update({ measureIndex: 0 });
  }
}
