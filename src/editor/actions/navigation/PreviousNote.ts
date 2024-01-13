import { Application } from "../../state/Application";
import { Action } from "../Action";

export class PreviousNote extends Action {
  static actionForState(_application: Application) {
    return new PreviousNote();
  }

  apply(application: Application) {
    application.selection.previousNote();
  }
}
