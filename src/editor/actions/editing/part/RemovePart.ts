import * as notation from "../../../../notation";
import type { Application } from "../../../state/Application";
import { narrowInstance } from "../../../utils/narrow";
import { Action } from "../../Action";

export class RemovePart extends Action {
  static readonly name = "Remove part";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = null;

  static actionForState(application: Application) {
    const score = application.selection.score?.score;
    const part = application.selection.part?.part;
    return score && part ? new RemovePart(score, part) : null;
  }

  static actionForContextMenu(application: Application) {
    const score = application.selection.score?.score;
    const part = narrowInstance(application.state.contextMenuSubject, notation.Part);
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

  undo() {
    this.score.addPart(this.part, this.index);
  }
}
