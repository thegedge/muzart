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

  constructor(readonly name: NoteValueName) {}

  /**
   * Convert this duration to an integer.
   */
  toInt(): number {
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
    }
  }
}
