import { Application } from "../../state/Application";
import { Action } from "../Action";

export class NextMeasure extends Action {
  static actionForState(_application: Application) {
    return new NextMeasure();
  }

  apply(application: Application) {
    application.selection.nextMeasure();
  }
}
