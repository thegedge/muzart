import { range } from "lodash";
import { action, computed, flow, makeObservable, observable } from "mobx";
import { maxMap, Measure } from "../layout";
import { NoteValue, NoteValueName } from "../notation";
import { Selection } from "../ui/state/Selection";
import { Instrument } from "./instruments/Instrument";
import { SoundFont } from "./SoundFont";
import { noteValueToSeconds } from "./util/durations";

export class PlaybackController {
  /** If true, playing back the entire score */
  public playing = false;

  /** Measure currently being played */
  public currentMeasure: Measure | undefined;

  /** @private */
  public soundFont: SoundFont | undefined;

  private audioContext: AudioContext;
  private playbackHandle: number | undefined;
  private setCurrentMeasureHandle: number | undefined;

  private instruments_: Record<string, Instrument | undefined> = {};

  constructor(private selection: Selection) {
    this.audioContext = new AudioContext();

    makeObservable(this, {
      playing: observable,
      currentMeasure: observable.ref,
      soundFont: observable.ref,

      instruments: computed,

      setCurrentMeasure: action,
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
    const currentlyPlaying = this.playing; // capture before this.stop(), which will set to false
    this.stop();
    if (currentlyPlaying) {
      return;
    }

    const score = this.selection.score;
    if (!score) {
      return;
    }

    const measureStartTimes = this.measureTimes();
    let nextMeasureTime = this.audioContext.currentTime;
    let currentMeasureIndex = this.selection.measureIndex;
    const queueNextMeasureAudio = () => {
      if (!this.playing) {
        return;
      }

      // Since this callback may be called before the EXACT start of the measure, we need to figure out how far
      // into the future the measure's events should occur
      const offsetFromNowSecs = nextMeasureTime - this.audioContext.currentTime;

      score.children.forEach((part, partIndex) => {
        const measure = part.part.measures[currentMeasureIndex];
        if (!measure) {
          return;
        }

        if (part == this.selection.part) {
          console.info(offsetFromNowSecs);
          const pageWithMeasure = part.children.find((page) => !!page.measures.find((m) => m.measure == measure));
          const nextMeasure = pageWithMeasure?.measures.find((m) => m.measure == measure);

          if (offsetFromNowSecs < 0.001) {
            // If it's less than a millisecond away, just set it now
            this.setCurrentMeasure(nextMeasure);
          } else {
            // We don't need perfection here, but would be nice to ensure this timeout is better aligned with the audio context
            this.setCurrentMeasureHandle = window.setTimeout(() => {
              this.setCurrentMeasure(nextMeasure);
            }, 1000 * offsetFromNowSecs);
          }
        }

        const instrument = this.instrumentForPart(partIndex);
        if (instrument) {
          let currentTime = offsetFromNowSecs;
          for (const chord of measure.chords) {
            if (!chord.rest) {
              for (const note of chord.notes) {
                instrument.playNote(note, this.tempoOfSelection, currentTime);
                if (note.graceNote) {
                  const graceNoteTime = noteValueToSeconds(note.graceNote.value, this.tempoOfSelection);
                  instrument.playNote(note.graceNote, this.tempoOfSelection, currentTime - graceNoteTime);
                }
              }
            }

            currentTime += noteValueToSeconds(chord.value, this.tempoOfSelection);
          }
        }
      });

      // Schedule the next handler to be a little before the actual starting time so there's time to queue the audio
      // events, but also gives us a decent buffer in case we're delayed due to some CPU bound work.
      const currentMeasureDurationSecs = measureStartTimes[currentMeasureIndex++];
      nextMeasureTime += currentMeasureDurationSecs;
      this.playbackHandle = window.setTimeout(queueNextMeasureAudio, 500 * currentMeasureDurationSecs);
    };

    this.playing = true;

    if (this.audioContext.state == "suspended") {
      void this.audioContext.resume().then(() => queueNextMeasureAudio());
    } else {
      queueNextMeasureAudio();
    }
  }

  stop() {
    if (this.playbackHandle) {
      clearTimeout(this.playbackHandle);
      clearTimeout(this.setCurrentMeasureHandle);
      this.playbackHandle = undefined;
      this.setCurrentMeasureHandle = undefined;

      for (const instrument of Object.values(this.instruments_)) {
        instrument?.stop();
      }

      void this.audioContext.suspend();
      this.playing = false;
    }
  }

  playSelectedNote(): void {
    const note = this.selection.note?.note;
    if (note) {
      this.instrument?.playNote(note, this.tempoOfSelection, undefined, true);
    }
  }

  setCurrentMeasure(measure: Measure | undefined) {
    this.currentMeasure = measure;
  }

  private measureTimes(): number[] {
    const score = this.selection.score?.score;
    if (!score) {
      return [];
    }

    let currentTempo = this.tempoOfSelection;
    return range(score.parts[0].measures.length).map((measureIndex) => {
      const maybeTempoChange = maxMap(score.parts, (part) => part.measures[measureIndex].staffDetails.tempo?.value);
      currentTempo = maybeTempoChange ?? currentTempo;

      // TODO Does a whole note always span an entire measure?
      return noteValueToSeconds(new NoteValue(NoteValueName.Whole), currentTempo);
    });
  }

  private get tempoOfSelection() {
    return this.selection.measure?.measure.staffDetails.tempo?.value ?? 128;
  }

  private instrumentForPart(partIndex: number): Instrument | null {
    const part = this.selection.score?.children[partIndex]?.part;
    if (!this.soundFont || !part?.instrument) {
      return null;
    }

    // TODO this may be problematic if two parts have the same midi preset, but share the same instrument (verify)

    const midiPreset = part.instrument.midiPreset;
    let instrument = this.instruments_[midiPreset];
    if (!instrument) {
      try {
        instrument = this.soundFont?.instrument(this.audioContext, part.instrument);
        this.instruments_[midiPreset] = instrument;
      } catch (err) {
        return null;
      }
    }

    return instrument;
  }
}
