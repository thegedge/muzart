import { memoize } from "lodash";
import { SampleZone } from "../SoundFont";
import { Instrument, InstrumentOptions } from "./Instrument";

export interface SamplerOptions extends InstrumentOptions {
  buffers: [number, SampleZone][];
}

/**
 * An instrument that takes a set of note buffers and can interpolate all other notes from those.
 */
export abstract class SamplerInstrument extends Instrument {
  /** The stored and loaded buffers */
  protected buffers: Map<number, SampleZone>;

  constructor(options: SamplerOptions) {
    if (!options.buffers) {
      throw new Error("no sample buffers provided to Sampler");
    }

    super(options);
    this.buffers = new Map(options.buffers);
  }

  /**
   * Create a buffer source for the given sample.
   */
  protected createToneBufferSource(sample: SampleZone, offset: number, loop = true) {
    const source = this.context.createBufferSource();
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
