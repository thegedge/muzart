import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export class ChangePartName extends Action {
  static readonly name = "Change part name";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = null;

  private readonly oldName: string;

  constructor(
    private part: notation.Part,
    private newName: string,
  ) {
    super();
    this.oldName = part.name;
  }

  apply(_application: Application) {
    this.part.setName(this.newName);
  }

  undo() {
    this.part.setName(this.oldName);
  }
}
