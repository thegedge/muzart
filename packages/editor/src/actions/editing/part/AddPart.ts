import * as notation from "@muzart/notation";
import type { Application } from "../../../state/Application";
import { Action } from "../../Action";

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
    this.part = newPart(score);
  }

  apply(application: Application) {
    const partIndex = this.score.addPart(this.part);
    application.selection.update({ partIndex });
  }

  undo(_application: Application) {
    this.score.removePart(this.part);
  }
}

const STANDARD_TUNING = ["E4", "B3", "G3", "D3", "A2", "E2"];

export const newPart = (score: notation.Score) => {
  const instrument = new notation.StringInstrument({
    // Acoustic guitar, standard tuning
    midiPreset: 25,
    volume: 0.8125,
    tuning: STANDARD_TUNING.map((pitch) => notation.Pitch.fromScientificNotation(pitch)),
  });

  const measures = (score.parts[0]?.measures ?? []).map(
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
  );

  if (measures.length == 0) {
    measures.push(
      new notation.Measure({
        number: 1,
        chords: [
          new notation.Chord({
            value: notation.NoteValue.fromString("whole"),
            notes: [],
          }),
        ],
        // TODO double check these values
        staffDetails: {
          clef: {
            changed: true,
            value: { sign: "G", line: 2 },
          },
          key: {
            changed: true,
            value: { fifths: 0 },
          },
          time: {
            changed: true,
            value: new notation.TimeSignature(new notation.NoteValue(notation.NoteValueName.Quarter), 4),
          },
          tempo: {
            changed: true,
            value: 128,
          },
        },
      }),
    );
  }

  return new notation.Part({
    name: "Untitled Guitar Track",
    lineCount: instrument.tuning.length,
    measures,
    instrument,
  });
};
