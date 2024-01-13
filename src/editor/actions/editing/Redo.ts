import { Application } from "../../state/Application";
import { Action } from "../Action";

export class Redo extends Action {
  static actionForState(_application: Application) {
    return new Redo();
  }

  apply(application: Application) {
    application.redo();
  }
}
