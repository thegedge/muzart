import { range } from "lodash";
import { action, autorun, computed, flow, makeObservable, observable } from "mobx";
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

  /** Whether or not a part is muted */
  public mutedParts: boolean[] = [];

  /** Whether or not a part is soloed (i.e., only play this part and other soloed parts) */
  public soloedParts: boolean[] = [];

  /** @private */
  public soundFont: SoundFont | undefined;

  private audioContext: AudioContext;
  private playbackHandle: number | undefined;
  private setCurrentMeasureHandle: number | undefined;

  private instruments_: Record<string, Instrument | undefined> = {};

  constructor(private selection: Selection) {
    this.audioContext = new AudioContext();

    // Adjust size of muted/soloed track arrays when score changes
    let score = selection.score;
    autorun(() => {
      if (score == selection.score) {
        return;
      }

      this.mutedParts = new Array(selection.score?.score.parts.length).fill(false);
      this.soloedParts = new Array(selection.score?.score.parts.length).fill(false);
      score = selection.score;
    });

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

  toggleMute(index: number) {
    this.mutedParts[index] = !this.mutedParts[index];
  }

  toggleSolo(index: number) {
    this.soloedParts[index] = !this.soloedParts[index];
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
          1000 * (offsetFromNowSecs - nextMeasureBufferTime)
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

      score.children.forEach((part, partIndex) => {
        const measure = part.part.measures[currentMeasureIndex];
        if (!measure) {
          return;
        }

        if (part == this.selection.part) {
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

        // Do this after the above so that we still set the current measure
        if (!partIndicesToPlay[partIndex]) {
          return;
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
      this.playbackHandle = window.setTimeout(
        queueNextMeasureAudio,
        1000 * (nextMeasureTime - nextMeasureBufferTime - this.audioContext.currentTime)
      );
    };

    this.playing = true;
    this.currentMeasure = this.selection.measure;

    if (this.audioContext.state == "suspended") {
      void this.audioContext.resume().then(() => {
        queueNextMeasureAudio();
      });
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
      this.playing = false;

      for (const instrument of Object.values(this.instruments_)) {
        instrument?.stop();
      }

      void this.audioContext.suspend();
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
