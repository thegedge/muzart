import { Application } from "../../state/Application";
import { Action } from "../Action";

export class NextPart extends Action {
  static actionForState(_application: Application) {
    return new NextPart();
  }

  apply(application: Application) {
    application.selection.nextPart();
  }
}
