import { clamp } from "lodash";

export enum NoteValueName {
  Whole = "whole",
  Half = "half",
  Quarter = "quarter",
  Eighth = "eighth",
  Sixteenth = "sixteenth",
  ThirtySecond = "thirty second",
  SixtyFourth = "sixty fourth",
  OneTwentyEighth = "one hundred and twenty eighth",
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
  static fromNumber(num: number): NoteValue {
    return new NoteValue(nameFromNumber(num));
  }

  static fromString(str: string): NoteValue {
    switch (str) {
      case "whole":
        return new NoteValue(NoteValueName.Whole);
      case "half":
        return new NoteValue(NoteValueName.Half);
      case "quarter":
        return new NoteValue(NoteValueName.Quarter);
      case "8th":
      case "eighth":
        return new NoteValue(NoteValueName.Eighth);
      case "16th":
      case "sixteenth":
        return new NoteValue(NoteValueName.Sixteenth);
      case "32nd":
      case "thirty second":
        return new NoteValue(NoteValueName.ThirtySecond);
      case "64th":
      case "sixty fourth":
        return new NoteValue(NoteValueName.SixtyFourth);
      case "128th":
      case "one hundred and twenty eighth":
        return new NoteValue(NoteValueName.OneTwentyEighth);
      default:
        throw new Error(`unexpected input: ${str}`);
    }
  }

  readonly dots: number;
  readonly tuplet?: Tuplet;

  constructor(
    readonly name: NoteValueName,
    options?: Partial<NoteValueOptions>,
  ) {
    this.dots = clamp(options?.dots || 0, 0, 3);
    this.tuplet = options?.tuplet;
  }

  /**
   * Check if this note value is equal to another.
   */
  isEqual(other: NoteValue) {
    return this.name === other.name && this.dots === other.dots && this.tuplet === other.tuplet;
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
   * Increase this note value (i.e., make it longer).
   *
   * @returns a new `NoteValue` instance with a longer duration than the current
   */
  increase() {
    return new NoteValue(nameFromNumber(this.toNumber() / 2), {
      dots: this.dots,
      tuplet: this.tuplet,
    });
  }

  /**
   * Decrease this note value (i.e., make it shorter).
   *
   * @returns a new `NoteValue` instance with a shorter duration than the current
   */
  decrease() {
    return new NoteValue(nameFromNumber(2 * this.toNumber()), {
      dots: this.dots,
      tuplet: this.tuplet,
    });
  }

  /**
   * Construct a copy of this note with the specified number of dots.
   *
   * @returns a new `NoteValue` instance that has the given number of dots
   */
  withName(name: NoteValueName) {
    return new NoteValue(name, { dots: this.dots, tuplet: this.tuplet });
  }

  /**
   * Construct a copy of this note with the specified number of dots.
   *
   * @returns a new `NoteValue` instance that has the given number of dots
   */
  withDots(dots: number) {
    return new NoteValue(this.name, { dots: clamp(dots, 0, 3), tuplet: this.tuplet });
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
   * Convert this duration to a numerical representation (the inverse of fromNumber).
   *
   * Whole note is 1, half note is 2, quarter note is 4, and so on.
   */
  toNumber(): number {
    switch (this.name) {
      case NoteValueName.Whole:
        return 1;
      case NoteValueName.Half:
        return 2;
      case NoteValueName.Quarter:
        return 4;
      case NoteValueName.Eighth:
        return 8;
      case NoteValueName.Sixteenth:
        return 16;
      case NoteValueName.ThirtySecond:
        return 32;
      case NoteValueName.SixtyFourth:
        return 64;
      case NoteValueName.OneTwentyEighth:
        return 128;
    }
  }

  /**
   * Convert this duration to a decimal, factoring in dots and tuplet values.
   *
   * Whole note is 1, half note is 0.5, quarter note is 0.25, and so on.
   * A single dotted half note would be 0.75.
   */
  toDecimal(): number {
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
      case NoteValueName.OneTwentyEighth:
        denominator = 128;
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

const nameFromNumber = (num: number) => {
  switch (num) {
    case 1:
      return NoteValueName.Whole;
    case 2:
      return NoteValueName.Half;
    case 4:
      return NoteValueName.Quarter;
    case 8:
      return NoteValueName.Eighth;
    case 16:
      return NoteValueName.Sixteenth;
    case 32:
      return NoteValueName.ThirtySecond;
    case 64:
      return NoteValueName.SixtyFourth;
    case 128:
      return NoteValueName.OneTwentyEighth;
    default:
      throw new Error(`unexpected input: ${num}`);
  }
};
