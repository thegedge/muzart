import { Application } from "../../state/Application";
import { Action } from "../Action";

export class HideHelp extends Action {
  static readonly name = "Hide help";
  static readonly when = "helpVisible";
  static readonly defaultKeyBinding = "Escape";

  static actionForState(_application: Application) {
    return new HideHelp();
  }

  apply(application: Application) {
    application.state.toggleHelp();
  }
}
