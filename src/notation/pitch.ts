export enum Step {
  A,
  B,
  C,
  D,
  E,
  F,
  G,
}

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
    const octave = (value - stepIndex) / PITCHES.length;
    const pitch = PITCHES[stepIndex];
    return new Pitch((pitch[0] as unknown) as Step, octave, pitch.length - 1);
  }

  constructor(readonly step: Step, readonly octave: number, readonly alterations = 0) {}

  toString() {
    let alterations = "";
    if (this.alterations > 0) {
      alterations = "♯".repeat(this.alterations);
    } else if (this.alterations < 0) {
      alterations = "♭".repeat(-this.alterations);
    }
    return `${this.step}${alterations}${this.octave}`;
  }
}
