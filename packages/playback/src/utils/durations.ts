import { Note, NoteValue } from "@muzart/notation";

/**
 * Full duration of a note, incorporating the duration of its ties.
 */
export const noteDurationInSeconds = (note: Note, tempo = 128): number => {
  let currentNote: Note | undefined = note;
  let duration = 0;
  while (currentNote) {
    duration += noteValueToSeconds(currentNote.value, tempo);
    currentNote = currentNote.tie?.next?.note;
  }
  return duration;
};

/**
 * Duration of a specific note value.
 */
export const noteValueToSeconds = (value: NoteValue, tempo: number): number => {
  const beat = 0.25; // TODO assuming each quarter note is a beat, need time signature
  const numBeats = value.toDecimal() / beat;
  const beatsPerSecond = tempo / 60.0;
  return numBeats / beatsPerSecond;
};
