import { Application } from "../../state/Application";
import { Action } from "../Action";

export class StopEditingHarmonic extends Action {
  static readonly name = "Stop editing harmonic";
  static readonly when = "editingHarmonic";
  static readonly defaultKeyBinding = "Escape";

  static actionForState(_application: Application) {
    return new StopEditingHarmonic();
  }

  apply(application: Application) {
    application.state.toggleEditingHarmonic();
  }
}
