import * as notation from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { narrowInstance } from "../../../utils/narrow";
import { Action } from "../../Action";

export class EditTimeSignature extends Action {
  static readonly name = "Edit time signature";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = null;

  static actionForState(application: Application) {
    const measure = application.selection.measure?.measure;
    return measure ? new EditTimeSignature(measure) : null;
  }

  static actionForContextMenu(application: Application) {
    const measure = narrowInstance(application.state.contextMenuSubject, notation.Measure);
    return measure ? new EditTimeSignature(measure) : null;
  }

  constructor(readonly measure: notation.Measure) {
    super();
  }

  apply(application: Application) {
    application.state.showModalFor(this.measure, "staffDetails.time");
  }
}
