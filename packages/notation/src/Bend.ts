export enum BendType {
  // Regular
  Bend = "Bend",
  BendRelease = "Bend and Release",
  BendReleaseBend = "Bend and Release and Bend",
  Prebend = "Prebend",
  PrebendRelease = "Prebend and Release",

  // Tremolo bar
  Dip = "Dip",
  Dive = "Dive",
  ReleaseUp = "Release (up)",
  InvertedDip = "Inverted Dip",
  Return = "Return",
  ReleaseDown = "Release (down)",
}

export interface BendPoint {
  /** The timing of this point, relative to the duration of the associated note (0 = beginning, 1 = end) */
  time: number;

  /** The amplitude of the bend, measured in tones (i.e., 1 is a full bend, 0.5 is a half bend) */
  amplitude: number;
}

export interface Bend {
  type: BendType;

  /** The overall amplitude of the bend, measured in tones (i.e., 1 is a full bend, 0.5 is a half bend) */
  amplitude: number;

  /** The various amplitudes of the bend, across the duration of the bend */
  points: BendPoint[];
}

export const defaultBendPointsForType = (type: BendType): BendPoint[] => {
  switch (type) {
    case BendType.Bend:
      return [
        { time: 0.0, amplitude: 0.0 },
        { time: 1.0, amplitude: 1.0 },
      ];
    case BendType.BendRelease:
      return [
        { time: 0.0, amplitude: 0.0 },
        { time: 0.5, amplitude: 1.0 },
        { time: 1.0, amplitude: 0.0 },
      ];
    case BendType.BendReleaseBend:
      return [
        { time: 0.0, amplitude: 0.0 },
        { time: 0.333, amplitude: 1.0 },
        { time: 0.666, amplitude: 0.0 },
        { time: 1.0, amplitude: 1.0 },
      ];
    case BendType.Prebend:
      return [
        { time: 0.0, amplitude: 1.0 },
        { time: 1.0, amplitude: 1.0 },
      ];
    case BendType.PrebendRelease:
      return [
        { time: 0.0, amplitude: 1.0 },
        { time: 1.0, amplitude: 0.0 },
      ];
    case BendType.Dip:
    case BendType.Dive:
    case BendType.ReleaseUp:
    case BendType.InvertedDip:
    case BendType.Return:
    case BendType.ReleaseDown:
      // TODO - implement these
      return [
        { time: 0.0, amplitude: 1.0 },
        { time: 1.0, amplitude: 0.0 },
      ];
  }
};
