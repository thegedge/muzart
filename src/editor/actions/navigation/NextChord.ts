import { Application } from "../../state/Application";
import { Action } from "../Action";

export class NextChord extends Action {
  static readonly name = "Next chord";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = "ArrowRight";

  static actionForState(_application: Application) {
    return new NextChord();
  }

  apply(application: Application) {
    application.selection.nextChord();
  }
}
