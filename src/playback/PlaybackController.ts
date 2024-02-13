import { range } from "lodash";
import { action, autorun, flow, makeObservable, observable } from "mobx";
import { Selection } from "../editor/state/Selection";
import layout, { maxMap } from "../layout";
import { NoteValue, NoteValueName } from "../notation";
import { Instrument } from "./Instrument";
import { DefaultSourceGenerator } from "./factories/DefaultSourceGenerator";
import { SoundFont } from "./factories/SoundFont";
import { SourceGeneratorFactory } from "./types";
import { noteValueToSeconds } from "./util/durations";

export class PlaybackController {
  /** If true, playing back the entire score */
  public playing = false;

  /** Measure currently being played */
  public currentMeasure: layout.Measure | undefined;

  public startOfCurrentMeasure = 0; // In audio context time

  /** Whether or not a part is muted */
  public mutedParts: boolean[] = [];

  /** Whether or not a part is soloed (i.e., only play this part and other soloed parts) */
  public soloedParts: boolean[] = [];

  /** @private */
  private sourceGeneratorFactory: SourceGeneratorFactory = new DefaultSourceGenerator();

  /** @private */
  #isReady = false;

  private audioContext: AudioContext;
  private playbackHandle: number | undefined;
  private setCurrentMeasureHandle: number | undefined;

  private instruments_: Record<string, Instrument | null> = {};

  constructor(private selection: Selection) {
    this.audioContext = new AudioContext();
    this.init().catch((err) => {
      console.error("could not load audio worklets", err);
    });

    // Adjust size of muted/soloed track arrays when score changes
    let score = selection.score;
    autorun(() => {
      if (score == selection.score) {
        return;
      }

      this.reset();
      score = selection.score;
    });

    makeObservable(this, {
      playing: observable,
      currentMeasure: observable.ref,
      mutedParts: observable,
      soloedParts: observable,

      setCurrentMeasure: action,
      togglePlay: action,
      stop: action,
      reset: action,
      loadSoundFont: flow,
    });
  }

  async init() {
    await Promise.all([this.audioContext.audioWorklet.addModule("./worklets/KarplusStrong.js")]);

    this.reset();
    this.#isReady = true;
  }

  reset() {
    this.mutedParts = new Array(this.selection.score?.score.parts.length).fill(false);
    this.soloedParts = new Array(this.selection.score?.score.parts.length).fill(false);
    this.stop();
  }

  get instrument() {
    return this.instrumentForPart(this.selection.partIndex);
  }

  toggleMute(index: number) {
    this.mutedParts[index] = !this.mutedParts[index];
  }

  toggleSolo(index: number) {
    this.soloedParts[index] = !this.soloedParts[index];
  }

  *loadSoundFont(source: string | URL | File | Response | ArrayBuffer): Generator<Promise<SoundFont>> {
    try {
      console.time("loading soundfont");
      this.sourceGeneratorFactory = (yield SoundFont.fromSource(source)) as SoundFont;
      this.instruments_ = {};
      console.timeEnd("loading soundfont");
    } catch (error) {
      console.error(error);
    }
  }

  togglePlay() {
    if (!this.isReady) {
      console.warn("playback controller asked to start playback before audio context ready");
      return;
    }
    const currentlyPlaying = this.playing; // capture before this.stop(), which will set to false
    this.stop();
    if (currentlyPlaying) {
      return;
    }

    const score = this.selection.score;
    if (!score) {
      return;
    }

    this.startOfCurrentMeasure = this.audioContext.currentTime;

    // The (approximate) number of seconds before the next measure where we queue up its note events
    const nextMeasureBufferTime = 0.1;

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
      if (offsetFromNowSecs > nextMeasureBufferTime) {
        this.playbackHandle = window.setTimeout(
          queueNextMeasureAudio,
          1000 * (offsetFromNowSecs - nextMeasureBufferTime),
        );
        return;
      }

      // Figure out which tracks to play from muted/soloed arrays
      let partIndicesToPlay: ReadonlyArray<boolean>;
      const hasSoloedTrack = this.soloedParts.some((v) => v);
      if (hasSoloedTrack) {
        partIndicesToPlay = this.soloedParts;
      } else {
        partIndicesToPlay = this.mutedParts.map((v) => !v);
      }

      score.score.parts.forEach((part, partIndex) => {
        const measure = part.measures[currentMeasureIndex];
        if (!measure) {
          return;
        }

        if (part == this.selection.part?.part) {
          const pageWithMeasure = this.selection.part.children.find(
            (page) => !!page.measures.find((m) => m.measure == measure),
          );
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

        // Do this after the above so that we still set the current measure
        if (!partIndicesToPlay[partIndex]) {
          return;
        }

        const instrument = this.instrumentForPart(partIndex);
        if (!instrument) {
          return;
        }

        const gain = partIndex == this.selection.partIndex ? undefined : 0.2;
        let currentTime = offsetFromNowSecs;
        for (const chord of measure.chords) {
          if (!chord.rest) {
            for (const note of chord.notes) {
              instrument.playNote(note, { tempo: this.tempoOfSelection, when: currentTime, gain });

              if (note.graceNote) {
                const graceNoteTime = noteValueToSeconds(note.graceNote.value, this.tempoOfSelection);
                instrument.playNote(note.graceNote, {
                  tempo: this.tempoOfSelection,
                  when: currentTime - graceNoteTime,
                  gain,
                });
              }
            }
          }

          currentTime += noteValueToSeconds(chord.value, this.tempoOfSelection);
        }
      });

      // Schedule the next handler to be a little before the actual starting time so there's time to queue the audio
      // events, but also gives us a decent buffer in case we're delayed due to some CPU bound work.
      const currentMeasureDurationSecs = measureStartTimes[currentMeasureIndex++];
      nextMeasureTime += currentMeasureDurationSecs;
      this.playbackHandle = window.setTimeout(
        queueNextMeasureAudio,
        1000 * (nextMeasureTime - nextMeasureBufferTime - this.audioContext.currentTime),
      );
    };

    this.playing = true;
    this.currentMeasure = this.selection.measure;
    this.withPlayback(queueNextMeasureAudio);
  }

  stop() {
    if (this.playbackHandle) {
      clearTimeout(this.playbackHandle);
      clearTimeout(this.setCurrentMeasureHandle);
      this.playbackHandle = undefined;
      this.setCurrentMeasureHandle = undefined;
      this.playing = false;
      this.currentMeasure = undefined;

      for (const instrument of Object.values(this.instruments_)) {
        instrument?.stop();
      }

      this.audioContext.suspend().catch(console.error);
    }
  }

  get isReady() {
    return this.#isReady;
  }

  playNote(note = this.selection.note?.note): void {
    if (note) {
      this.withPlayback(() => {
        this.instrument?.stop();
        this.instrument?.playNote(note, { tempo: this.tempoOfSelection, durationSecs: 1 });
      });
    }
  }

  setCurrentMeasure(measure: layout.Measure | undefined) {
    this.currentMeasure = measure;
    this.startOfCurrentMeasure = this.audioContext.currentTime;
  }

  get currentTime(): number {
    return this.audioContext.currentTime;
  }

  get tempoOfSelection() {
    return this.selection.measure?.measure.staffDetails.tempo?.value ?? 128;
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

  private instrumentForPart(partIndex: number): Instrument | null {
    const part = this.selection.score?.score.parts[partIndex];
    if (!this.sourceGeneratorFactory || !part?.instrument) {
      return null;
    }

    // TODO this may be problematic if two parts have the same midi preset, but share the same instrument (verify)

    const midiPreset = part.instrument.midiPreset;
    let instrument = this.instruments_[midiPreset];
    if (!instrument) {
      try {
        const sourceGenerator = this.sourceGeneratorFactory?.generator(this.audioContext, part.instrument);
        if (!sourceGenerator) {
          return null;
        }

        instrument = new Instrument({
          context: this.audioContext,
          instrument: part.instrument,
          sourceGenerator,
        });
        this.instruments_[midiPreset] = instrument;
      } catch (err) {
        return null;
      }
    }

    return instrument;
  }

  private withPlayback(f: () => void) {
    if (this.audioContext.state == "suspended") {
      this.audioContext
        .resume()
        .then(() => {
          f();
        })
        .catch(console.error);
    } else {
      f();
    }
  }
}
