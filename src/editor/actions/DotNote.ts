import * as notation from "../../notation";
import { Application } from "../state/Application";
import { SelectionTrackingAction } from "./SelectionTrackingAction";

export class DotNote extends SelectionTrackingAction {
  private state!: [notation.Chord, notation.Note | undefined, notation.Note]; // chord, existing, new

  constructor(readonly dots: number) {
    super();
  }

  canApply(application: Application) {
    const chord = application.selection.chord?.chord;
    const note = application.selection.note?.note;
    return !!(chord && note);
  }

  apply(application: Application) {
    super.apply(application);

    const instrument = application.selection.part?.part.instrument;
    const chord = application.selection.chord?.chord;
    const note = application.selection.note?.note;
    if (!instrument || !chord || !note) {
      return;
    }

    const newNote = note.withChanges({ value: note.value.withDots(this.dots) });
    const existing = chord.changeNote(newNote);

    application.playback.playNote(newNote);

    this.state = [chord, existing, newNote];
  }

  undo(application: Application) {
    super.undo(application);

    const [chord, oldNote, newNote] = this.state;
    if (oldNote) {
      chord.changeNote(oldNote);
    } else {
      chord.removeNote(newNote);
    }
  }
}
