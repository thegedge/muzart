import { Chord, type Measure, type NoteValue } from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

export class AddChord extends Action {
  static readonly name = "Add chord";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = null;

  static actionForState(application: Application) {
    const measure = application.selection.measure?.measure;
    const value = application.selection.chord?.chord.value;
    return measure && value ? new AddChord(measure, value) : null;
  }

  readonly chord: Chord;

  constructor(
    readonly measure: Measure,
    value: NoteValue,
  ) {
    super();
    this.chord = new Chord({ value, notes: [] });
  }

  apply(_application: Application) {
    this.measure.addChord(this.chord);
  }

  undo() {
    this.measure.removeChord(this.chord);
  }
}
