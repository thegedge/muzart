import { Application } from "../../state/Application";
import { Action } from "../Action";

export class StopEditingTimeSignature extends Action {
  static readonly name = "Stop editing time signature";
  static readonly when = "editingTimeSignature";
  static readonly defaultKeyBinding = "Escape";

  static actionForState(_application: Application) {
    return new StopEditingTimeSignature();
  }

  apply(application: Application) {
    application.state.toggleEditingTimeSignature();
  }
}
