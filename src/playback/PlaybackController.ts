import { Sampler } from "tone";
import { Chord, Note, Part } from "../notation";
import { noteValueToSeconds } from "./util/durations";

export class PlaybackController {
  private instrument: Sampler;
  private playbackHandle?: NodeJS.Timeout;

  constructor() {
    // TODO factor out instrument
    const NOTES = [
      "A2",
      "A3",
      "A4",
      "A5",
      "Ab2",
      "Ab3",
      "Ab4",
      "Ab5",
      "B2",
      "B3",
      "B4",
      "B5",
      "Bb2",
      "Bb3",
      "Bb4",
      "Bb5",
      "C#3",
      "C#4",
      "C#5",
      "C#6",
      "C3",
      "C4",
      "C5",
      "C6",
      "D3",
      "D4",
      "D5",
      "D6",
      "E2",
      "E3",
      "E4",
      "E5",
      "Eb3",
      "Eb4",
      "Eb5",
      "F#2",
      "F#3",
      "F#4",
      "F#5",
      "F2",
      "F3",
      "F4",
      "F5",
      "G2",
      "G3",
      "G4",
      "G5",
    ];

    const noteMap: Record<string, string> = {};
    for (const note of NOTES) {
      noteMap[note] = encodeURIComponent(`notes/${note}.mp3`);
    }

    this.instrument = new Sampler(noteMap).toDestination();
  }

  togglePlay(part: Part, startFrom?: { measure?: number; chord?: number }) {
    if (this.playbackHandle) {
      this.stop();
    } else {
      let currentMeasure = startFrom?.measure ?? 0;
      let currentChord = startFrom?.chord ?? 0;

      const playNext = () => {
        const measure = part.measures[currentMeasure];
        const chord = measure.chords[currentChord];
        const seconds = this.playChord(chord);

        currentChord += 1;
        if (currentChord >= measure.chords.length) {
          currentMeasure += 1;
          currentChord = 0;
          if (currentMeasure >= part.measures.length) {
            return;
          }
        }

        this.playbackHandle = setTimeout(playNext, 1000 * seconds);
      };

      playNext();
    }
  }

  stop() {
    if (this.playbackHandle) {
      clearTimeout(this.playbackHandle);
      this.playbackHandle = undefined;
    }
  }

  playNote(note: Note) {
    const seconds = noteValueToSeconds(note.value);
    this.instrument.triggerAttackRelease(note.pitch.toString(), seconds);
    return seconds;
  }

  playChord(chord: Chord) {
    const seconds = noteValueToSeconds(chord.value);
    if (!chord.rest) {
      const notes = chord.notes.filter((note) => !note.tie || note.tie.type === "start");
      if (notes.length > 0) {
        this.instrument.triggerAttackRelease(
          notes.map((note) => note.pitch.toString()),
          seconds
        );
      }
    }
    return seconds;
  }
}
