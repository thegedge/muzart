import { NoteValue } from "../../notation";

export function noteValueToSeconds(value: NoteValue, tempo = 128): number {
  const beat = 0.25; // TODO assuming each quarter note is a beat
  const numBeats = value.toDecimal() / beat;
  const beatsPerSecond = tempo / 60.0;
  return numBeats / beatsPerSecond;
}
