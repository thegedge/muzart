import { Application } from "../../state/Application";
import { Action } from "../Action";

export class PreviousPart extends Action {
  static actionForState(_application: Application) {
    return new PreviousPart();
  }

  apply(application: Application) {
    application.selection.previousPart();
  }
}
