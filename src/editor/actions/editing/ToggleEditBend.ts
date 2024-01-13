import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ToggleEditBend extends Action {
  static actionForState(_application: Application) {
    return new ToggleEditBend();
  }

  apply(application: Application) {
    application.state.toggleEditingBend();
  }
}
