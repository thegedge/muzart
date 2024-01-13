import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export class RemovePart extends Action {
  static actionForState(application: Application) {
    const score = application.selection.score?.score;
    const part = application.selection.part?.part;
    return score && part ? new RemovePart(score, part) : null;
  }

  private index = -1;

  constructor(
    private score: notation.Score,
    private part: notation.Part,
  ) {
    super();
    this.index = score.parts.indexOf(part);
  }

  apply(_application: Application) {
    this.score.removePart(this.part);
  }

  undo(_application: Application) {
    this.score.addPart(this.part, this.index);
  }
}
