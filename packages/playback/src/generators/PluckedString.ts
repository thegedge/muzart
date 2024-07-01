import * as notation from "@muzart/notation";
import { AudioWorkletNode } from "../nodes/AudioWorkletNode";
import { SourceGenerator } from "../types";

export type PluckedStringOptions = {
  /** The audio context this generator will use */
  context: AudioContext;

  /** The instrument this generator will be used for */
  instrument: notation.Instrument;

  /**
   * The amount of gain to apply to each sample
   *
   * This gain doesn't apply to the original impulse, but is applied after the delay value has been computed
   * and before the clipping has been applied (if any)
   *
   * @default 1
   */
  gain?: number;

  /**
   * The kind of impulse to generate for the Karplus-Strong algorithm
   *
   * @default "white-noise"
   */
  impulseType?: "white-noise" | "sine" | "noisy-sine";

  /**
   * The kind of filter to use for each delay loop of the Karplus-Strong algorithm.
   *
   * @default "average"
   */
  filterType?: "average" | "gaussian";

  /**
   * The kind of clipping to use for each delay loop of the Karplus-Strong algorithm.
   *
   * This is useful to drive various distortion effects.
   *
   * @default undefined (no clipping)
   */
  clipType?: "cubic_nonlinear";
};

declare global {
  interface AudioParamMap {
    get(key: string): AudioParam | undefined;
  }
}

/**
 * A generator that simulates a plucked string.
 */
export class PluckedString implements SourceGenerator {
  constructor(private options: PluckedStringOptions) {}

  generate(note: notation.Note) {
    const karplusStrongNode = new globalThis.AudioWorkletNode(this.options.context, "karplus-strong", {
      processorOptions: {
        updateType: "blend",
        impulseType: this.options.impulseType,
        filterType: this.options.filterType,
        clipType: this.options.clipType,
        gain: this.options.gain,
      },
    });

    const frequency = karplusStrongNode.parameters.get("frequency");
    if (!frequency) {
      throw new Error("Frequency parameter not found");
    }
    frequency.setValueAtTime(note.pitch.toFrequency(), 0);

    return new AudioWorkletNode(karplusStrongNode);
  }
}
