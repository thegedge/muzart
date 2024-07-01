import { Application } from "../../state/Application";
import { Action } from "../Action";

export class HideContextMenu extends Action {
  static readonly name = "Close context menu";
  static readonly when = "contextMenuSubject";
  static readonly defaultKeyBinding = "Escape";

  static actionForState(_application: Application) {
    return new HideContextMenu();
  }

  apply(application: Application) {
    application.state.hideContextMenu();
  }
}
