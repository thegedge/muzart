import { action, makeObservable, observable } from "mobx";
import { Selection } from "../muzart/components/state/Selection";
import { Chord, Note } from "../notation";
import { Instrument } from "./instruments/Instrument";
import { SamplerInstrument } from "./instruments/sampler/SamplerInstrument";
import { noteValueToSeconds } from "./util/durations";

export class PlaybackController {
  // eslint-disable-next-line @typescript-eslint/require-await
  static async construct() {
    return new PlaybackController(new SamplerInstrument());
  }

  /** If true, playing back the entire score */
  public playing = false;

  private playbackHandle?: NodeJS.Timeout;

  constructor(private instrument: Instrument) {
    makeObservable(this, {
      playing: observable,
      togglePlay: action,
      stop: action,
      playChord: action,
      playNote: action,
    });
  }

  togglePlay(selection: Selection) {
    if (this.playbackHandle) {
      this.stop();
    } else {
      // TODO play across all parts, not just the selected one
      const part = selection.part?.part;
      if (!part) {
        return;
      }

      let currentMeasure = selection.measureIndex;
      let currentChord = selection.chordIndex;

      // TODO if we had an autorun that played on selection change, we'd only need the setTimeout
      const playNext = () => {
        const measure = part.measures[currentMeasure];
        const chord = measure.chords[currentChord];
        const seconds = this.playChord(chord);

        selection.update({
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

  playChord(chord: Chord) {
    const seconds = noteValueToSeconds(chord.value);
    if (!chord.rest) {
      for (const note of chord.notes) {
        this.instrument.playNote(note);
      }
    }
    return seconds;
  }

  playNote(note: Note): void {
    this.instrument.playNote(note);
  }
}
