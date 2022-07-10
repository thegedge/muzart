import { memoize } from "lodash";
import * as notation from "../../notation";
import { SampleWithBuffer } from "../SoundFont";
import { noteValueToSeconds } from "../util/durations";
import { Instrument } from "./Instrument";

interface SamplerOptions {
  context: AudioContext;
  buffers: [number, SampleWithBuffer][];
}

/**
 * An instrument that takes a set of note buffers and can interpolate all other notes from those.
 */
export class SamplerInstrument implements Instrument {
  readonly name: string = "Sampler";

  /** The audio context in which this sampler instrument will be used */
  private context: AudioContext;

  /** The stored and loaded buffers */
  private buffers: Map<number, SampleWithBuffer>;

  /** The object of all currently playing BufferSources */
  private activeSources: Map<number, AudioBufferSourceNode[]> = new Map();

  constructor(options: SamplerOptions) {
    if (!options.buffers) {
      throw new Error("no sample buffers provided to Sampler");
    }

    this.context = options.context;
    this.buffers = new Map(options.buffers);
  }

  /**
   * Clean up all audio resources.
   */
  dispose() {
    this.activeSources.forEach((sources) => {
      sources.forEach((source) => source.disconnect());
    });
    this.activeSources.clear();
  }

  // TODO figure out if I could just use the regular ToneJS sampler hooked into some output nodes

  playNote(note: notation.Note, startTime?: number): number | undefined {
    if (note.tie && note.tie.type != "start") {
      return;
    }

    const duration = note.dead ? 0.05 : this.tiedNoteDurationSeconds(note);
    try {
      const source = this.createToneBufferSource(note);

      // TODO Make these work again
      this.maybeBend(note, source);
      this.maybeVibrato(note);

      source.connect(this.context.destination);

      const computedTime = this.context.currentTime + (startTime ?? 0);
      source.start(computedTime, 0, duration);
      this.addActiveSource(source, note.pitch.toMidi());
    } catch (e) {
      console.warn(e);
    }

    return duration;
  }

  /** Returns the difference in steps between the given midi note at the closets sample.  */
  private findClosest = memoize((midi: number): [SampleWithBuffer, number] => {
    for (let offset = 0; offset < 96; ++offset) {
      const hiBuffer = this.buffers.get(midi + offset);
      if (hiBuffer) {
        return [hiBuffer, offset];
      }

      const loBuffer = this.buffers.get(midi - offset);
      if (loBuffer) {
        return [loBuffer, -offset];
      }
    }

    throw new Error(`No available buffers for note: ${midi}`);
  });

  private createToneBufferSource(note: notation.Note): AudioBufferSourceNode {
    const midi = note.pitch.toMidi();
    const [sample, offset] = this.findClosest(midi);

    // Frequency doubles per octave.
    // see https://en.wikipedia.org/wiki/Scientific_pitch_notation#Table_of_note_frequencies
    const playbackRate = Math.pow(2, -offset / 12);

    const source = this.context.createBufferSource();
    source.buffer = sample.buffer;
    source.playbackRate.value = playbackRate;
    source.loop = true;
    source.loopStart = sample.startLoop - sample.start;
    source.loopEnd = sample.endLoop - sample.start;
    return source;
  }

  private addActiveSource(source: AudioBufferSourceNode, midiNote: number) {
    let sources = this.activeSources.get(midiNote);
    if (!sources) {
      sources = [];
      this.activeSources.set(midiNote, sources);
    }
    sources.push(source);

    const closureSources = sources;
    source.addEventListener("ended", () => {
      const index = closureSources.indexOf(source);
      if (index !== -1) {
        closureSources.splice(index, 1);
        source.disconnect();
      }
    });

    return source;
  }

  private maybeVibrato(note: notation.Note) {
    if (!note.vibrato) {
      return;
    }

    // return new Vibrato({
    //   context: this.context,
    //   frequency: 4, // TODO customizable?
    //   depth: 0.5,
    // });
  }

  private maybeBend(note: notation.Note, _source: AudioBufferSourceNode) {
    if (!note.bend) {
      return;
    }

    // const duration = this.tiedNoteDurationSeconds(note);
    // const value = source.playbackRate.value;
    // let previousTime = 0;
    // for (const { time, amplitude } of note.bend.points) {
    //   const ratio = intervalToFrequencyRatio(amplitude * 2);
    //   const bendPointDuration = duration * (time - previousTime);
    //   source.playbackRate.linearRampTo(value * ratio, bendPointDuration);
    //   previousTime = time;
    // }
  }

  private tiedNoteDurationSeconds(note?: notation.Note) {
    let seconds = 0;

    // TODO get tempo from tab and provide to `noteValueToSeconds` below

    // TODO this is wrong, because the tied note could pass through many other notes, so we need to
    //      also find out all of the durations in between
    while (note) {
      seconds += noteValueToSeconds(note.value);
      note = note.tie?.next;
    }
    return seconds;
  }
}
