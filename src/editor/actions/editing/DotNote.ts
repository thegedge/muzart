import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export class DotNote extends Action {
  constructor(
    private chord: notation.Chord,
    private note: notation.Note,
    readonly dots: number,
  ) {
    super();
  }

  apply(_application: Application) {
    this.chord.changeNote(this.note.withChanges({ value: this.note.value.withDots(this.dots) }));
  }

  undo() {
    this.chord.changeNote(this.note);
  }
}

export const dotNoteAction = (dots: number) => {
  return class extends DotNote {
    static readonly name = dots == 0 ? "Remove note dots" : dots == 1 ? "Dot note" : `Dot note ${dots} times`;
    static readonly when = "editorFocused";
    static readonly defaultKeyBinding = null;

    static actionForState(application: Application) {
      const chord = application.selection.chord?.chord;
      const note = application.selection.note?.note;
      return chord && note ? new DotNote(chord, note, dots) : null;
    }
  };
};
