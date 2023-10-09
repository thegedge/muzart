import { memoize } from "lodash";
import * as notation from "../../notation";
import { SourceNode } from "../types";
import { SampleZone, SoundFontGeneratorType } from "../factories/SoundFont";
import { createEnvelope } from "../util/envelope";
import { createGainNode } from "../util/gain";

export interface SamplerOptions {
  /** The audio context in which this sampler will be used */
  context: AudioContext;

  /** The instrument this sampler is derived from */
  instrument: notation.Instrument;

  /** The sample buffers to pull from, in the format `[midi number, sample data]` */
  buffers: [number, SampleZone][];
}

/**
 * A generator using samples to produce sound.
 */
export class Sampler {
  private buffers: Map<number, SampleZone>;

  constructor(private options: SamplerOptions) {
    if (!options.buffers) {
      throw new Error("no sample buffers provided to Sampler");
    }

    this.buffers = new Map(options.buffers);
  }

  generate(note: notation.Note, when: number): SourceNode {
    const midi = note.pitch.toMidi();
    const [sample, offset] = this.findClosest(midi);
    const source = this.createToneBufferSource(sample, offset);

    const output = createGainNode(this.options.context, this.options.instrument, note);
    const attack = sample.generators[SoundFontGeneratorType.EnvelopeVolumeAttack];
    const decay = sample.generators[SoundFontGeneratorType.EnvelopeVolumeDecay];
    const release = sample.generators[SoundFontGeneratorType.EnvelopeVolumeRelease];
    const sustain = sample.generators[SoundFontGeneratorType.EnvelopeVolumeSustain];
    createEnvelope(output.gain, { attack, sustain, decay, release }, when);

    source.connect(output);

    return { source, output };
  }

  /**
   * Create a buffer source for the given sample.
   */
  protected createToneBufferSource(sample: SampleZone, offset: number, loop = true) {
    const source = this.options.context.createBufferSource();
    source.buffer = sample.buffer;
    source.detune.value = -100 * offset; // TODO figure out why large values don't seem to work (at least in Firefox)
    source.loop = loop;
    source.loopStart = (sample.startLoop - sample.start) / sample.sampleRate;
    source.loopEnd = (sample.endLoop - sample.start) / sample.sampleRate;
    return source;
  }

  /**
   * Returns the difference in steps between the given midi note at the closets sample.
   */
  protected findClosest = memoize((midi: number): [SampleZone, number] => {
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
}
