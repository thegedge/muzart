import { Application } from "../../state/Application";
import { Action } from "../Action";

export class NextPage extends Action {
  static actionForState(_application: Application) {
    return new NextPage();
  }

  apply(application: Application) {
    application.selection.nextPage();
  }
}
