import { Application } from "../../state/Application";
import { Action } from "../Action";

export class PreviousPage extends Action {
  static actionForState(_application: Application) {
    return new PreviousPage();
  }

  apply(application: Application) {
    application.selection.previousPage();
  }
}
