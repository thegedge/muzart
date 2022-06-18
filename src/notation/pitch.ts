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
   * Construct a pitch from an integer.
   *
   * 0 corresponds to C0. Every value thereafter occurs in half-step increments. In other words, 13 would be C#1. Will
   * always favour sharps over flats.
   */
  static fromInt(value: number) {
    const stepIndex = value % PITCHES.length;
    const octave = Math.floor(value / PITCHES.length);
    const pitch = PITCHES[stepIndex];
    return new Pitch(pitch[0] as unknown as Step, octave, pitch.length - 1);
  }

  constructor(readonly step: Step, readonly octave: number, readonly alterations = 0) {}

  /**
   * Return a new pitch that is this note adjusted by the given number of semitones.
   */
  adjust(semitones: number) {
    return Pitch.fromInt(this.toInt() + semitones);
  }

  /**
   * Convert this pitch to an integer.
   *
   * 0 is equivalent to C0, in semitone increments.
   */
  toInt() {
    return this.octave * 12 + SEMITONE_OFFSETS[this.step] + this.alterations;
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
