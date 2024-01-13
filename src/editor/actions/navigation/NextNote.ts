import { Application } from "../../state/Application";
import { Action } from "../Action";

export class NextNote extends Action {
  static actionForState(_application: Application) {
    return new NextNote();
  }

  apply(application: Application) {
    application.selection.nextNote();
  }
}
