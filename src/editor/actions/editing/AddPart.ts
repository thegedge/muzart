import * as notation from "../../../notation";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export class AddPart extends Action {
  static readonly name = "Add part";
  static readonly when = "editorFocused";
  static readonly defaultKeyBinding = null;

  static actionForState(application: Application) {
    const score = application.selection.score?.score;
    return score ? new AddPart(score) : null;
  }

  static actionForContextMenu(application: Application) {
    const score = application.selection.score?.score;
    return score ? new AddPart(score) : null;
  }

  private part: notation.Part;

  constructor(private score: notation.Score) {
    super();

    this.part = new notation.Part({
      name: "Untitled Track",
      lineCount: 6,
      measures: score.parts[0].measures.map(
        (m, index) =>
          new notation.Measure({
            number: index + 1,
            staffDetails: {
              clef: m.staffDetails.clef && { ...m.staffDetails.clef },
              key: m.staffDetails.key && { ...m.staffDetails.key },
              tempo: m.staffDetails.tempo && { ...m.staffDetails.tempo },
              time: m.staffDetails.time && { ...m.staffDetails.time },
            },
            chords: [
              new notation.Chord({
                value: notation.NoteValue.fromString("whole"),
                notes: [],
              }),
            ],
          }),
      ),
      instrument: new notation.StringInstrument({
        // Acoustic guitar, standard tuning
        midiPreset: 25,
        volume: 0.8125,
        tuning: ["E4", "B3", "G3", "D3", "A2", "E2"].map((pitch) => notation.Pitch.fromScientificNotation(pitch)),
      }),
    });
  }

  apply(application: Application) {
    const partIndex = this.score.addPart(this.part);
    application.selection.update({ partIndex });
  }

  undo() {
    this.score.removePart(this.part);
  }
}
