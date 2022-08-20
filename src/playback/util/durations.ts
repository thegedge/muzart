import { NoteValue } from "../../notation";

export const noteValueToSeconds = (value: NoteValue, tempo = 128): number => {
  const beat = 0.25; // TODO assuming each quarter note is a beat, need time signature
  const numBeats = value.toDecimal() / beat;
  const beatsPerSecond = tempo / 60.0;
  return numBeats / beatsPerSecond;
};
