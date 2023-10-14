import * as notation from "../../notation";
import { SourceGenerator, SourceNode } from "../types";
import { createGainNode } from "../util/gain";

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

  /**
   * The brightness value to use when `updateType` is "blend"
   *
   * The value ranges from 0 to 1, with 1 being the "brightest" sound. This would be similar to plucking a guitar
   * string near the bridge. 0 would be similar to a muted string pluck.
   */
  brightness: number;
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

  generate(note: notation.Note, when: number): SourceNode {
    const karplusStrongNode = new AudioWorkletNode(this.options.context, "karplus-strong", {
      processorOptions: {
        frequency: note.pitch.toFrequency(),
        updateType: "blend",
        impulseType: this.options.impulseType,
        when,
      },
    });

    const param = karplusStrongNode.parameters.get("brightness");
    if (param) {
      param.setValueAtTime(this.options.brightness, 0);
    }

    const output = createGainNode(this.options.context, this.options.instrument, note);

    karplusStrongNode.connect(output);

    return { source: karplusStrongNode, output };
  }
}
