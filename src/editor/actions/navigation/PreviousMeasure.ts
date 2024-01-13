import { Application } from "../../state/Application";
import { Action } from "../Action";

export class PreviousMeasure extends Action {
  static actionForState(_application: Application) {
    return new PreviousMeasure();
  }

  apply(application: Application) {
    application.selection.previousMeasure();
  }
}
