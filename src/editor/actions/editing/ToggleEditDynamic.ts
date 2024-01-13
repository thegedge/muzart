import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ToggleEditDynamic extends Action {
  static actionForState(_application: Application) {
    return new ToggleEditDynamic();
  }

  apply(application: Application) {
    application.state.toggleEditingDynamic();
  }
}
