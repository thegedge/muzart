import * as notation from "@muzart/notation";
import { AudioWorkletNode } from "../nodes/AudioWorkletNode";
import type { SourceGenerator } from "../types";

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

  /**
   * Maximum random per-note pitch offset in cents (+/-).
   *
   * It scales the initial frequency, so bends and vibrato should be  unaffected. Typically used as
   * a means of "humanizing" the output. How humans fret--location, pressure, and so on--can often
   * cause very slight variations.
   *
   * @default 3 (slight detune)
   */
  detuneCents?: number;
};

/**
 * Frequency ratio for a pitch offset in cents.
 */
export function centsToRatio(cents: number): number {
  return 2 ** (cents / 1200);
}

/**
 * A random frequency ratio uniformly spread over +-maxCents. `random` returns [0, 1) and is injectable for tests.
 */
export function randomDetuneRatio(maxCents: number, random: () => number = Math.random): number {
  return maxCents > 0 ? centsToRatio((random() * 2 - 1) * maxCents) : 1;
}

declare global {
  interface AudioParamMap {
    get(key: string): AudioParam | undefined;
  }
}

/**
 * A generator that simulates a plucked string.
 */
export class PluckedString implements SourceGenerator {
  private options: PluckedStringOptions;

  constructor(options: PluckedStringOptions) {
    this.options = options;
  }

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

    frequency.setValueAtTime(note.pitch.toFrequency() * randomDetuneRatio(this.options.detuneCents ?? 3), 0);

    return new AudioWorkletNode(karplusStrongNode);
  }
}
