import { Application } from "../../state/Application";
import { Action } from "../Action";

export class HideModal extends Action {
  static readonly name = "Hide modal";
  static readonly when = "modalSubject";
  static readonly defaultKeyBinding = "Escape";

  static actionForState(_application: Application) {
    return new HideModal();
  }

  apply(application: Application) {
    application.state.hideModal();
  }
}
