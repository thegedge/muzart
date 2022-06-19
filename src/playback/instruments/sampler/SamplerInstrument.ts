import { Note } from "../../../notation";
import { Sampler } from "./Sampler";

export class SamplerInstrument {
  private instrument: Sampler;

  constructor() {
    this.instrument = new Sampler({ urls: NOTES }).toDestination();
  }

  playNote(note: Note) {
    this.instrument.playNote(note);
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
