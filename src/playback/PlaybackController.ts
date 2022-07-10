import { action, computed, makeObservable, observable } from "mobx";
import { Selection } from "../app/components/state/Selection";
import { SoundFont } from "./SoundFont";
import { noteValueToSeconds } from "./util/durations";

export class PlaybackController {
  // eslint-disable-next-line @typescript-eslint/require-await
  static async construct(selection: Selection) {
    const soundFont = await SoundFont.fromURL(encodeURI("soundfonts/MuseScore v1.442.sf2"));
    // const soundFont = await SoundFont.fromURL(encodeURI("soundfonts/Essential Keys-sforzando-v9.6.sf2"));
    return new PlaybackController(soundFont, selection);
  }

  /** If true, playing back the entire score */
  public playing = false;

  private audioContext: AudioContext;
  private playbackHandle?: NodeJS.Timeout;

  constructor(private soundFont: SoundFont, private selection: Selection) {
    this.audioContext = new AudioContext();

    makeObservable(this, {
      playing: observable,
      instruments: computed,
      togglePlay: action,
      stop: action,
    });
  }

  get instrument() {
    const midiPreset = this.selection.part?.part.instrument?.midiPreset ?? 24;
    return this.soundFont.instrument(this.audioContext, midiPreset);
  }

  get instruments(): { name: string; midiPreset: number }[] {
    return this.soundFont.instruments;
  }

  togglePlay() {
    if (this.playbackHandle) {
      this.stop();
    } else {
      // TODO play across all parts, not just the selected one
      const part = this.selection.part?.part;
      if (!part) {
        return;
      }

      let currentMeasure = this.selection.measureIndex;
      let currentChord = this.selection.chordIndex;

      // TODO if we had an autorun that played on selection change, we'd only need the setTimeout
      const playNext = () => {
        this.selection.update({
          measureIndex: currentMeasure,
          chordIndex: currentChord,
        });

        const seconds = this.playSelectedChord();

        currentChord += 1;

        const measure = part.measures[currentMeasure];
        if (currentChord >= measure.chords.length) {
          currentMeasure += 1;
          currentChord = 0;
          if (currentMeasure >= part.measures.length) {
            this.stop();
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

  playSelectedChord() {
    const chord = this.selection.chord?.chord;
    if (chord && !chord.rest) {
      for (const note of chord.notes) {
        this.instrument.playNote(note);
      }
    }

    return chord ? noteValueToSeconds(chord.value) : 0;
  }

  playSelectedNote(): void {
    const note = this.selection.note?.note;
    if (note) {
      this.instrument.playNote(note);
    }
  }
}
