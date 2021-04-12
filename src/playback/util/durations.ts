import { NoteValue } from "../../notation";

// TODO no default for tempo, but currently set to a common tempo for rock
export function noteValueToSeconds(value: NoteValue, tempo = 128): number {
  // TODO assuming 4/4, which has four beats, each beat consists of 1 quarter
  const beat = 0.25;
  const numBeats = value.toDecimal() / beat;
  const beatsPerSecond = tempo / 60;
  return numBeats / beatsPerSecond;
}
