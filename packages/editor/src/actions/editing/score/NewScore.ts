import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

export class NewScore extends Action {
  static readonly name = "New score";
  static readonly when = "";
  static readonly defaultKeyBinding = "$mod + Alt + KeyN";

  static actionForState(_application: Application) {
    return new NewScore();
  }

  apply(application: Application) {
    // TODO determine if current score has changes and ask if user wants to save them

    // TODO abstract away the need to put #/ at the front of the URL
    application.navigate(`#/empty:Untitled.muzart`);
  }
}
