import { Application } from "../../state/Application";
import { Action } from "../Action";

export class NextChord extends Action {
  static actionForState(_application: Application) {
    return new NextChord();
  }

  apply(application: Application) {
    application.selection.nextChord();
  }
}
