import { Application } from "../../state/Application";
import { Action } from "../Action";

export class StopEditingDynamic extends Action {
  static readonly name = "Stop editing dynamic";
  static readonly when = "editingDynamic";
  static readonly defaultKeyBinding = "Escape";

  static actionForState(_application: Application) {
    return new StopEditingDynamic();
  }

  apply(application: Application) {
    application.state.toggleEditingDynamic();
  }
}
