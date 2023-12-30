import * as notation from "../../notation";
import { Application } from "../state/Application";
import { SelectionTrackingAction } from "./SelectionTrackingAction";

export class ChangeNoteValue extends SelectionTrackingAction {
  private state!: notation.NoteValue;

  constructor(readonly value: notation.NoteValueName) {
    super();
  }

  canApply(application: Application) {
    const chord = application.selection.chord;
    return !!chord;
  }

  apply(application: Application) {
    super.apply(application);

    const chord = application.selection.chord?.chord;
    if (!chord) {
      return;
    }

    this.state = chord.value;

    chord.setValue(chord.value.withName(this.value));
  }

  undo(application: Application) {
    super.undo(application);

    const chord = application.selection.chord?.chord;
    if (!chord) {
      return;
    }

    chord.setValue(this.state);
  }
}
