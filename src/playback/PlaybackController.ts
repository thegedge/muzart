import { makeAutoObservable } from "mobx";
import { Selection } from "../app/components/state/Selection";
import { Chord, Note, Part } from "../notation";
import { Sampler } from "./Sampler";
import { noteValueToSeconds } from "./util/durations";

export class PlaybackController {
  public playing = false;
  private instrument: Sampler;
  private playbackHandle?: NodeJS.Timeout;

  constructor() {
    makeAutoObservable(this, undefined, { deep: false });
    this.instrument = new Sampler({ urls: NOTES }).toDestination();
  }

  togglePlay(part: Part, startFrom?: Selection) {
    if (this.playbackHandle) {
      this.stop();
    } else {
      let currentMeasure = startFrom?.measureIndex ?? 0;
      let currentChord = startFrom?.chordIndex ?? 0;

      const playNext = () => {
        const measure = part.measures[currentMeasure];
        const chord = measure.chords[currentChord];
        const seconds = this.playChord(chord);

        startFrom?.update({
          measureIndex: currentMeasure,
          chordIndex: currentChord,
        });

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

      this.playing = true;
      playNext();
    }
  }

  stop() {
    if (this.playbackHandle) {
      clearTimeout(this.playbackHandle);
      // TODO somehow disconnect the instrument or whatever needs to be done to stop it from playing
      this.playing = false;
      this.playbackHandle = undefined;
    }
  }

  playNote(note: Note) {
    this.instrument.playNote(note);
  }

  playChord(chord: Chord) {
    const seconds = noteValueToSeconds(chord.value);
    if (!chord.rest) {
      for (const note of chord.notes) {
        this.instrument.playNote(note);
      }
    }
    return seconds;
  }
}

// TODO factor out instrument
const NOTES = Object.fromEntries(
  [
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
  ].map((note) => [note, encodeURIComponent(`notes/${note}.mp3`)])
);
