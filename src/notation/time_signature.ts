import { NoteValue, NoteValueName } from "./note_value";

export interface Beat {
  value: NoteValue;
  count: number;
}

export class TimeSignature {
  constructor(readonly value: NoteValue, readonly count: number) {}

  /**
   * Return the length of a beat from the current time signature.
   *
   * @example 4/4 has a beat on every quarter note
   * (new TimeSignature(DurationBase.Quarter, 4)).toBeats() == { base: DurationBase.Quarter, number: 1 }
   *
   * @example 3/4 has a beat on every quarter note
   * (new TimeSignature(DurationBase.Quarter, 3)).toBeats() == { base: DurationBase.Quarter,  number: 1 }
   *
   * @example 6/8 has a beat on every three eighth notes
   * (new TimeSignature(DurationBase.Eighth, 6)).toBeats() == { base: DurationBase.Eighth, number: 3 }
   */
  toBeat(): Beat {
    // TODO Assumptions here on simple/compound, would love to remove them. Perhaps beats should be an additional attribute.

    switch (this.value.name) {
      case NoteValueName.Eighth: {
        // Compound signatures – 3/8, 6/8, 9/8, 12/8, and so on
        if (this.count % 3 === 0) {
          return { value: this.value, count: 3 };
        }
      }
      default:
        // Simple signatures – 4/4, 3/4, and so on
        return { value: this.value, count: 1 };
    }
  }
}
