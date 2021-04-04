import React, { createContext, useContext } from "react";
import { Sampler } from "tone";
import { Note } from "../../notation";

export interface Playback {
  playNote: (note: Note) => void;
}

const Context = createContext<Playback>({
  playNote: (_: Note) => {},
});

export function usePlayback() {
  return useContext(Context);
}

export function PlaybackContext(props: { children?: React.ReactNode }) {
  // TODO dynamically generate this list from some remote resource
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

  const sampler = new Sampler(noteMap).toDestination();
  const value = {
    playNote: (note: Note) => {
      // TODO read tempo from some ancestor of the note
      const tempo = 52;

      // TODO assuming 12/8, which has three beats, each beat consists of 4 eighth notes
      const beat = 4 * 0.125;
      const beatSecond = beat * 60;

      const seconds = (note.value.toDecimal() * tempo) / beatSecond;
      sampler.triggerAttackRelease(note.pitch.toString(), seconds);
    },
  };

  return <Context.Provider value={value}>{props.children}</Context.Provider>;
}
