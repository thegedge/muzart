import { Chord, Measure, NoteValue, type Part } from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

export class AddMeasure extends Action {
  static readonly name = "Add chord";
  static readonly when = "editorFocused && !isPlaying";
  static readonly defaultKeyBinding = null;

  static actionForState(application: Application) {
    const part = application.selection.part?.part;
    return part ? new AddMeasure(part) : null;
  }

  readonly measure: Measure;

  constructor(readonly part: Part) {
    super();

    const templateMeasure = part.measures[part.measures.length - 1];

    const { clef, key, tempo, time } = templateMeasure.staffDetails;

    this.measure = new Measure({
      number: part.measures.length + 1,
      staffDetails: {
        clef: clef && { changed: false, value: clef.value },
        key: key && { changed: false, value: key.value },
        tempo: tempo && { changed: false, value: tempo.value },
        time: time && { changed: false, value: time.value },
      },
      chords: [
        new Chord({
          value: NoteValue.fromNumber(1),
        }),
      ],
    });
  }

  apply(_application: Application) {
    this.part.addMeasure(this.measure);
  }

  undo() {
    this.part.removeMeasure(this.measure);
  }
}
