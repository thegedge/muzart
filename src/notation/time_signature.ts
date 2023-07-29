import { NoteValue, NoteValueName } from "./note_value";

export interface Beat {
  value: NoteValue;
  count: number;
}

export class TimeSignature {
  constructor(
    readonly value: NoteValue,
    readonly count: number,
  ) {}

  /**
   * Return the length of a beat from the current time signature.
   *
   * @example 4/4 has a beat on every quarter note
   * (new TimeSignature(DurationBase.Quarter, 4)).toBeats() == { base: DurationBase.Quarter, number: 1 }
   *
   * @example 3/4 has a beat on every quarter note
   * (new TimeSignature(DurationBase.Quarter, 3)).toBeats() == { base: DurationBase.Quarter,  number: 1 }
   *
   * @example 6/8 has a beat on every three eighth notes (compound metre)
   * (new TimeSignature(DurationBase.Eighth, 6)).toBeats() == { base: DurationBase.Eighth, number: 3 }
   */
  toBeat(): Beat {
    // TODO figure out if an eighth note can be simple metre
    // TODO maybe allow specifying the beat on construction

    switch (this.value.name) {
      case NoteValueName.Eighth: {
        // Compound signatures – 3/8, 6/8, 9/8, 12/8, and so on
        if (this.count % 3 === 0) {
          return { value: this.value, count: this.count / 3 };
        }

        // TODO what should we do here?
      }
      // eslint-disable-next-line no-fallthrough
      default:
        // Simple signatures – 4/4, 3/4, and so on
        return { value: this.value, count: 1 };
    }
  }
}
