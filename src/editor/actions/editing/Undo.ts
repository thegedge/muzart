import { Application } from "../../state/Application";
import { Action } from "../Action";

export class Undo extends Action {
  static actionForState(_application: Application) {
    return new Undo();
  }

  apply(application: Application) {
    application.undo();
  }
}
