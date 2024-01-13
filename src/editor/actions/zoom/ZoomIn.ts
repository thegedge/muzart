import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ZoomIn extends Action {
  static actionForState(_application: Application) {
    return new ZoomIn();
  }

  apply(application: Application) {
    application.canvas.setZoom(application.canvas.zoom * 1.2);
  }
}
