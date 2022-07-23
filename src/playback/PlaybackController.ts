import { action, computed, flow, makeObservable, observable } from "mobx";
import { Selection } from "../app/components/state/Selection";
import { NoteValue, NoteValueName } from "../notation";
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

  private instruments_: Record<string, Instrument | undefined> = {};

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
    return this.instrumentForPart(this.selection.partIndex);
  }

  get instruments(): { name: string; midiPreset: number }[] {
    return this.soundFont?.instruments ?? [];
  }

  *loadSoundFont(source: string | URL | File | Response | ArrayBuffer): Generator<Promise<SoundFont>> {
    try {
      console.time("loading soundfont");
      this.soundFont = (yield SoundFont.fromSource(source)) as SoundFont;
      this.instruments_ = {};
      console.timeEnd("loading soundfont");
    } catch (error) {
      console.error(error);
    }
  }

  togglePlay() {
    if (this.playbackHandle) {
      this.stop();
    } else {
      this.stop();

      const score = this.selection.score;
      if (!score) {
        return;
      }

      let currentMeasure = this.selection.measureIndex;

      const playNextMeasure = () => {
        let tempo: number | undefined;

        score.parts.forEach((part, partIndex) => {
          const measure = part.part.measures[currentMeasure];
          if (!measure) {
            this.stop();
            return;
          }

          tempo = measure.staffDetails.tempo?.value;
          const instrument = this.instrumentForPart(partIndex);
          if (instrument) {
            let currentTime = 0;
            for (const chord of measure.chords) {
              if (!chord.rest) {
                for (const note of chord.notes) {
                  instrument.playNote(note, this.tempoOfSelection, currentTime);
                }
              }

              currentTime += noteValueToSeconds(chord.value, this.tempoOfSelection);
            }
          }
        });

        currentMeasure += 1;

        // TODO setTimeout may not work great with the audio context timer, and could be blocked by other things happening
        //      on the main thread. May want it to happen more frequently, with overlaps.

        // TODO I don't think a whole note always spans an entire measure?
        this.playbackHandle = setTimeout(
          playNextMeasure,
          1000 * noteValueToSeconds(new NoteValue(NoteValueName.Whole), tempo)
        );
      };

      this.playing = true;
      playNextMeasure();
    }
  }

  stop() {
    if (this.playbackHandle) {
      clearTimeout(this.playbackHandle);
      this.playbackHandle = undefined;

      for (const instrument of Object.values(this.instruments_)) {
        instrument?.stop();
      }

      this.playing = false;
    }
  }

  playSelectedNote(): void {
    const note = this.selection.note?.note;
    if (note) {
      this.instrument?.playNote(note, this.tempoOfSelection);
    }
  }

  private get tempoOfSelection() {
    return this.selection.measure?.measure.staffDetails.tempo?.value ?? 128;
  }

  private instrumentForPart(partIndex: number): Instrument | null {
    const part = this.selection.score?.parts[partIndex]?.part;
    if (!this.soundFont || !part?.instrument) {
      return null;
    }

    // TODO this may be problematic if two parts have the same midi preset, but share the same instrument (verify)

    const midiPreset = part.instrument.midiPreset;
    let instrument = this.instruments_[midiPreset];
    if (!instrument) {
      instrument = this.soundFont?.instrument(this.audioContext, part.instrument);
      this.instruments_[midiPreset] = instrument;
    }

    return instrument;
  }
}
