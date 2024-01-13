import { Application } from "../../state/Application";
import { Action } from "../Action";

export class PreviousChord extends Action {
  static actionForState(_application: Application) {
    return new PreviousChord();
  }

  apply(application: Application) {
    application.selection.previousChord();
  }
}
