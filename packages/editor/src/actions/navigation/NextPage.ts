import { Application } from "../../state/Application";
import { Action } from "../Action";

export class NextPage extends Action {
  static readonly name = "Next page";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "PageDown";

  static actionForState(_application: Application) {
    return new NextPage();
  }

  apply(application: Application) {
    application.selection.nextPage();
  }
}
