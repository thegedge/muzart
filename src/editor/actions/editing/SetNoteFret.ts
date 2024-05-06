import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

// TODO assuming a stringed + fretted instrument below. Will need to fix eventually.

export class SetNoteFret extends Action {
  private note: notation.Note | undefined;
  private shouldPlayNote = true;

  constructor(
    private instrument: notation.StringInstrument,
    private chord: notation.Chord,
    private string: number,
    readonly fret: number,
  ) {
    super();
    this.note = chord.noteByString(string);
  }

  apply(application: Application) {
    const tuning = this.instrument.tuning[this.string];

    let newNote: notation.Note;
    if (this.note) {
      newNote = new notation.Note(
        this.note.withChanges({
          pitch: tuning.adjust(this.fret),
          placement: {
            string: this.string,
            fret: this.fret,
          },
          dead: undefined,
        }),
      );
    } else {
      newNote = new notation.Note({
        value: this.chord.value,
        pitch: tuning.adjust(this.fret),
        placement: {
          string: this.string,
          fret: this.fret,
        },
        dead: undefined,
      });
    }

    this.chord.changeNote(newNote);

    if (this.shouldPlayNote) {
      application.playback.playNote(newNote);
      this.shouldPlayNote = false;
    }
  }

  undo() {
    if (this.note) {
      this.chord.changeNote(this.note);
    } else {
      const note = this.chord.noteByString(this.string);
      if (note) {
        this.chord.removeNote(note);
      } else {
        // TODO throw error for "should never happen" in dev/test
      }
    }
  }
}
