import * as notation from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

export class ChangePartName extends Action {
  static readonly name = "Change part name";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = null;

  private readonly oldName: string;
  private part: notation.Part;
  private newName: string;

  constructor(part: notation.Part, newName: string) {
    super();
    this.part = part;
    this.newName = newName;
    this.oldName = part.name;
  }

  apply(_application: Application) {
    this.part.setName(this.newName);
  }

  undo(_application: Application) {
    this.part.setName(this.oldName);
  }
}
