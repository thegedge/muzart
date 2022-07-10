export enum Step {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
}

const SEMITONE_OFFSETS = {
  [Step.C]: 0,
  [Step.D]: 2,
  [Step.E]: 4,
  [Step.F]: 5,
  [Step.G]: 7,
  [Step.A]: 9,
  [Step.B]: 11,
};

const PITCHES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export class Pitch {
  /**
   * Construct a pitch from a scientific pitch notation string.
   *
   * 0 corresponds to C0. Every value thereafter occurs in half-step increments. In other words, 13 would be C#1. Will
   * always favour sharps over flats.
   */
  static fromScientificNotation(value: string) {
    const semitoneOffset = SEMITONE_OFFSETS[value[0] as Step];
    if (semitoneOffset == undefined) {
      throw new Error(`first character must be one of ${Object.values(Step).join(", ")}`);
    }

    let alterations = 0;
    let index = 1;
    while (index < value.length) {
      if (value[index] == "#") {
        alterations += 1;
      } else if (value[index] == "b") {
        alterations -= 1;
      } else {
        break;
      }

      index += 1;
    }

    const octave = parseInt(value.slice(index));
    if (Number.isNaN(octave)) {
      throw new Error("pitch notation must include an octave");
    }

    return new Pitch(value[0] as Step, octave, alterations);
  }

  /**
   * Construct a pitch from a midi note.
   *
   * 60 corresponds to middle C (C4). Every value thereafter occurs in half-step increments. In other words, 13 would be C#5.
   */
  static fromMidi(value: number) {
    const stepIndex = value % PITCHES.length;
    const octave = Math.floor(value / PITCHES.length) - 1;
    const pitch = PITCHES[stepIndex];
    return new Pitch(pitch[0] as Step, octave, pitch.length - 1);
  }

  constructor(readonly step: Step, readonly octave: number, readonly alterations = 0) {}

  /**
   * Return a new pitch that is this note adjusted by the given number of semitones.
   */
  adjust(semitones: number) {
    return Pitch.fromMidi(this.toMidi() + semitones);
  }

  /**
   * Convert this pitch to a midi note (60 = middle C, or C4).
   */
  toMidi() {
    // The 12 at the beginning is because C0 corresponds to midi note 12
    return 12 + this.octave * 12 + SEMITONE_OFFSETS[this.step] + this.alterations;
  }

  toString(fancy?: boolean) {
    let alterations = "";
    if (this.alterations > 0) {
      alterations = (fancy ? "♯" : "#").repeat(this.alterations);
    } else if (this.alterations < 0) {
      alterations = (fancy ? "♭" : "b").repeat(-this.alterations);
    }
    return `${this.step}${alterations}${this.octave}`;
  }
}
