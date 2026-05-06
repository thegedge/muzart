import * as notation from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

export class ToggleSlide extends Action {
  static readonly name = "Toggle slide";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = "s";

  static actionForState(application: Application) {
    const chord = application.selection.chord?.chord;
    const note = application.selection.note?.note;
    return chord && note ? new ToggleSlide(chord, note) : null;
  }

  private constructor(
    private chord: notation.Chord,
    private note: notation.Note,
  ) {
    super();
  }

  apply(_application: Application) {
    this.chord.changeNote(
      this.note.withChanges({
        slide: {
          type: notation.SlideType.LegatoSlide,
          upwards: true,
        },
      }),
    );
  }

  undo(_application: Application) {
    this.chord.changeNote(this.note);
  }
}
