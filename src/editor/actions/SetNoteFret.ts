import * as notation from "../../notation";
import { Application } from "../state/Application";
import { SelectionTrackingAction } from "./SelectionTrackingAction";

// TODO assuming a stringed + fretted instrument below. Will need to fix eventually.

export class SetNoteFret extends SelectionTrackingAction {
  private state!: [notation.Chord, notation.Note | undefined, notation.Note]; // chord, existing, new

  constructor(readonly fret: number) {
    super();
  }

  canApply(application: Application) {
    const instrument = application.selection.part?.part.instrument;
    const chord = application.selection.chord?.chord;
    return !!(instrument && chord);
  }

  apply(application: Application) {
    super.apply(application);

    const instrument = application.selection.part?.part.instrument;
    const chord = application.selection.chord?.chord;
    if (!instrument || !chord) {
      return;
    }

    const string = application.selection.noteIndex + 1;
    const tuning = instrument.tuning[application.selection.noteIndex];
    const note = application.selection.note?.note;

    const options = {
      value: note?.value ?? chord.value,
      pitch: tuning.adjust(this.fret),
      placement: {
        string,
        fret: this.fret,
      },
      dead: undefined,
    };

    const newNote = note ? note.withChanges(options) : new notation.Note(options);
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
