import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ToggleEditHarmonic extends Action {
  static actionForState(_application: Application) {
    return new ToggleEditHarmonic();
  }

  apply(application: Application) {
    application.state.toggleEditingHarmonic();
  }
}
