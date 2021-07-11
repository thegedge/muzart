import { clamp } from "lodash";

export enum NoteValueName {
  Whole = "whole",
  Half = "half",
  Quarter = "quarter",
  Eighth = "eighth",
  Sixteenth = "16th",
  ThirtySecond = "32nd",
  SixtyFourth = "64th",
}

export interface NoteValueOptions {
  /** The number of dots in this note */
  dots: number;

  /** The tuplet value (optional) for this note */
  tuplet?: Tuplet;
}

/**
 * A representation for an n-tuplet.
 *
 * For example, in simple metre, a triplet would be 3:2 (n=3, actual=2). This means three notes will
 * have the same duration as 2 notes (in other words, each note is 2/3 the normal duration).
 */
export interface Tuplet {
  /** The number of notes in the tuplet */
  n: number;

  /** The actual number of notes the tuplet represents */
  actual: number;
}

export class NoteValue {
  static fromNumber(num: 1 | 2 | 4 | 8 | 16 | 32 | 64): NoteValue {
    switch (num) {
      case 1:
        return new NoteValue(NoteValueName.Whole);
      case 2:
        return new NoteValue(NoteValueName.Half);
      case 4:
        return new NoteValue(NoteValueName.Quarter);
      case 8:
        return new NoteValue(NoteValueName.Eighth);
      case 16:
        return new NoteValue(NoteValueName.Sixteenth);
      case 32:
        return new NoteValue(NoteValueName.ThirtySecond);
      case 64:
        return new NoteValue(NoteValueName.SixtyFourth);
      default:
        throw new Error(`unexpected input: ${num}`);
    }
  }

  static fromString(str: `${NoteValueName}`): NoteValue {
    switch (str) {
      case "whole":
        return new NoteValue(NoteValueName.Whole);
      case "half":
        return new NoteValue(NoteValueName.Half);
      case "quarter":
        return new NoteValue(NoteValueName.Quarter);
      case "eighth":
        return new NoteValue(NoteValueName.Eighth);
      case "16th":
        return new NoteValue(NoteValueName.Sixteenth);
      case "32nd":
        return new NoteValue(NoteValueName.ThirtySecond);
      case "64th":
        return new NoteValue(NoteValueName.SixtyFourth);
      default:
        throw new Error(`unexpected input: ${str}`);
    }
  }

  readonly dots: number;
  readonly tuplet?: Tuplet;

  constructor(readonly name: NoteValueName, options?: Partial<NoteValueOptions>) {
    this.dots = clamp(options?.dots || 0, 0, 3);
    this.tuplet = options?.tuplet;
  }

  /**
   * Construct a copy of this note with an extra dot.
   *
   * @returns a new `NoteValue` instance that has one more dot than this one
   */
  dot() {
    return new NoteValue(this.name, { dots: this.dots + 1, tuplet: this.tuplet });
  }

  /**
   * Construct a copy of this note with the given tuplet value.
   *
   * @returns a new `NoteValue` instance that has one more dot than this one
   */
  withTuplet(tuplet?: Tuplet) {
    return new NoteValue(this.name, { dots: this.dots, tuplet });
  }

  /**
   * Convert this duration to a decimal.
   *
   * Whole note is 1, half note is 0.5, quarter note is 0.25, and so on.
   */
  toDecimal(): number {
    // TODO everything in here assumes simple metre

    let denominator = 0;
    switch (this.name) {
      case NoteValueName.Whole:
        denominator = 1;
        break;
      case NoteValueName.Half:
        denominator = 2;
        break;
      case NoteValueName.Quarter:
        denominator = 4;
        break;
      case NoteValueName.Eighth:
        denominator = 8;
        break;
      case NoteValueName.Sixteenth:
        denominator = 16;
        break;
      case NoteValueName.ThirtySecond:
        denominator = 32;
        break;
      case NoteValueName.SixtyFourth:
        denominator = 64;
        break;
    }

    if (this.tuplet) {
      denominator *= this.tuplet.n;
      denominator /= this.tuplet.actual;
    }

    // Each dot adds half of the previous value, starting from the note's value:
    // ```
    // value + value / 2 + value / 4 + ... + value / 2^ndots`
    // = value * (1 + (1/2 + 1/4 + ... + 1/2^ndots))
    // = value * (1 + (1 - 1/2^ndots))
    // = value * (2 - 1/(1 << ndots))
    // ```

    return (2 - 1 / (1 << this.dots)) / denominator;
  }
}
