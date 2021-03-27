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

  readonly ndots: number = 0;

  constructor(readonly name: NoteValueName, ndots = 0) {
    this.ndots = clamp(ndots, 0, 3);
  }

  /**
   * Construct a dotted version of this note value.
   *
   * @returns a new `NoteValue` instance that has one more dot than this one
   */
  dot() {
    return new NoteValue(this.name, this.ndots + 1);
  }

  /**
   * Convert this duration to a decimal.
   *
   * Whole note is 1, half note is 0.5, quarter note is 0.25, and so on.
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
    }

    // `1/2 + 1/2^2 .. 1/2^n = 1 - 1/2^n`
    //
    // ```
    // denominator + denominator / 2 + denominator / 4 + ... + denominator / 2^ndots`
    // = denominator * (1 + 1/2 + 1/4 + ... + 1/2^ndots)
    // = denominator * (1 + 1 - 1/2^ndots)
    // = denominator * (2 - 1 / (1 << ndots))
    // ```

    return (2 - 1 / (1 << this.ndots)) / denominator;
  }
}
