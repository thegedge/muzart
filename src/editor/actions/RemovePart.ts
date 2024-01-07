import * as notation from "../../notation";
import { Application } from "../state/Application";
import { Action } from "./Action";

export class RemovePart extends Action {
  private index = -1;

  constructor(readonly part: notation.Part) {
    super();
  }

  canApply(application: Application) {
    return application.selection.score !== null;
  }

  apply(application: Application) {
    this.index = application.selection.score!.score.parts.indexOf(this.part);
    application.selection.score!.score.removePart(this.part);
  }

  undo(application: Application) {
    application.selection.score!.score.addPart(this.part, this.index);
  }
}
