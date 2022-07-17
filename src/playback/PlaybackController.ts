import { action, computed, flow, makeObservable, observable } from "mobx";
import { Selection } from "../app/components/state/Selection";
import { Instrument } from "./instruments/Instrument";
import { SoundFont } from "./SoundFont";
import { noteValueToSeconds } from "./util/durations";

export class PlaybackController {
  /** If true, playing back the entire score */
  public playing = false;

  /** @private */
  public soundFont: SoundFont | undefined;

  private audioContext: AudioContext;
  private playbackHandle: NodeJS.Timeout | undefined;

  private instrument_: Instrument | undefined;
  private currentInstrumentPreset = -1;

  constructor(private selection: Selection) {
    this.audioContext = new AudioContext();

    makeObservable(this, {
      playing: observable,
      soundFont: observable.ref,

      instruments: computed,

      togglePlay: action,
      stop: action,
      loadSoundFont: flow,
    });
  }

  get instrument() {
    if (!this.soundFont) {
      return null;
    }

    const midiPreset = this.selection.part?.part.instrument?.midiPreset ?? 24; // default to 24, nylon guitar
    if (midiPreset != this.currentInstrumentPreset) {
      this.instrument_ = this.soundFont?.instrument(this.audioContext, midiPreset);
      this.currentInstrumentPreset = midiPreset;
    }

    return this.instrument_;
  }

  get instruments(): { name: string; midiPreset: number }[] {
    return this.soundFont?.instruments ?? [];
  }

  *loadSoundFont(url: string | URL): Generator<Promise<SoundFont>> {
    try {
      this.soundFont = (yield SoundFont.fromURL(url)) as SoundFont;
    } catch (error) {
      console.error(error);
    }
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
      this.instrument?.stop();
      this.playing = false;
      this.playbackHandle = undefined;
    }
  }

  playSelectedChord() {
    const chord = this.selection.chord?.chord;
    if (chord && !chord.rest) {
      for (const note of chord.notes) {
        this.instrument?.playNote(note);
      }
    }

    return chord ? noteValueToSeconds(chord.value) : 0;
  }

  playSelectedNote(): void {
    const note = this.selection.note?.note;
    if (note) {
      this.instrument?.playNote(note);
    }
  }
}
