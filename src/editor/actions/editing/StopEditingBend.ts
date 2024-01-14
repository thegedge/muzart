import { Application } from "../../state/Application";
import { Action } from "../Action";

export class StopEditingBend extends Action {
  static readonly name = "Stop editing bend";
  static readonly when = "editingBend";
  static readonly defaultKeyBinding = "Escape";

  static actionForState(_application: Application) {
    return new StopEditingBend();
  }

  apply(application: Application) {
    application.state.toggleEditingBend();
  }
}
