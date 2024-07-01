import { Box } from "@muzart/layout";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ResetZoom extends Action {
  static readonly name = "Reset zoom";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "$mod + 0";

  static actionForState(_application: Application) {
    return new ResetZoom();
  }

  apply(application: Application) {
    const box = application.selection.score?.box;
    if (!box) {
      return;
    }

    application.canvas.setViewport(
      new Box(0, 0, box.width, box.width * (application.canvas.canvasHeight / application.canvas.canvasWidth)),
    );
  }
}
