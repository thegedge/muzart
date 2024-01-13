import { Application } from "../../state/Application";
import { Action } from "../Action";

export class FirstPage extends Action {
  static actionForState(_application: Application) {
    return new FirstPage();
  }

  apply(application: Application) {
    application.selection.update({ measureIndex: 0 });
  }
}
