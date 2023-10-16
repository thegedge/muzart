import * as notation from "../../notation";
import { AudioWorkletNode } from "../nodes/AudioWorkletNode";
import { SourceGenerator } from "../types";

export type PluckedStringOptions = {
  /** The audio context this generator will use */
  context: AudioContext;

  /** The instrument this generator will be used for */
  instrument: notation.Instrument;

  /**
   * The kind of impulse to generate for the Karplus-Strong algorithm
   *
   * @default "white-noise"
   */
  impulseType?: "white-noise" | "sine" | "noisy-sine";
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
      },
    });

    const frequency = karplusStrongNode.parameters.get("frequency");
    frequency!.setValueAtTime(note.pitch.toFrequency(), 0);

    return new AudioWorkletNode(karplusStrongNode);
  }
}
