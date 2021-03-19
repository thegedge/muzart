export enum DurationBase {
  Whole = "whole",
  Half = "half",
  Quarter = "quarter",
  Eighth = "eighth",
  Sixteenth = "16th",
  ThirtySecond = "32nd",
  SixtyFourth = "64th",
}

export class Duration {
  static fromNumber(num: 1 | 2 | 4 | 8 | 16 | 32 | 64): Duration {
    switch (num) {
      case 1:
        return new Duration(DurationBase.Whole);
      case 2:
        return new Duration(DurationBase.Half);
      case 4:
        return new Duration(DurationBase.Quarter);
      case 8:
        return new Duration(DurationBase.Eighth);
      case 16:
        return new Duration(DurationBase.Sixteenth);
      case 32:
        return new Duration(DurationBase.ThirtySecond);
      case 64:
        return new Duration(DurationBase.SixtyFourth);
      default:
        throw new Error(`unexpected input: ${num}`);
    }
  }

  static fromString(str: `${DurationBase}`): Duration {
    switch (str) {
      case "whole":
        return new Duration(DurationBase.Whole);
      case "half":
        return new Duration(DurationBase.Half);
      case "quarter":
        return new Duration(DurationBase.Quarter);
      case "eighth":
        return new Duration(DurationBase.Eighth);
      case "16th":
        return new Duration(DurationBase.Sixteenth);
      case "32nd":
        return new Duration(DurationBase.ThirtySecond);
      case "64th":
        return new Duration(DurationBase.SixtyFourth);
      default:
        throw new Error(`unexpected input: ${str}`);
    }
  }

  constructor(readonly base: DurationBase) {}

  /**
   * Convert this duration to an integer.
   */
  toInt(): number {
    switch (this.base) {
      case DurationBase.Whole:
        return 1;
      case DurationBase.Half:
        return 2;
      case DurationBase.Quarter:
        return 4;
      case DurationBase.Eighth:
        return 8;
      case DurationBase.Sixteenth:
        return 16;
      case DurationBase.ThirtySecond:
        return 32;
      case DurationBase.SixtyFourth:
        return 64;
    }
  }
}
