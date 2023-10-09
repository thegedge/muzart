import * as notation from "../../notation";
import { SourceGenerator, SourceNode } from "../types";
import { createEnvelope } from "../util/envelope";
import { createGainNode } from "../util/gain";

export interface PluckedStringOptions {
  /** The audio context this generator will use */
  context: AudioContext;

  /** The instrument this generator will be used for */
  instrument: notation.Instrument;

  /**
   * The brightness value to use.
   *
   * The value ranges from 0 to 1, with 1 being the "brightest" sound. This would be similar to plucking a guitar
   * string near the bridge. 0 would be similar to a muted string pluck.
   */
  brightness: number;
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
  private brightness: number;

  constructor(private options: PluckedStringOptions) {
    this.brightness = options.brightness;
  }

  generate(note: notation.Note, when: number): SourceNode {
    const karplusStrongNode = new AudioWorkletNode(this.options.context, "karplus-strong", {
      processorOptions: {
        frequency: note.pitch.toFrequency(),
        when,
      },
    });

    const param = karplusStrongNode.parameters.get("brightness");
    if (param) {
      param.setValueAtTime(this.brightness, 0);
    }

    karplusStrongNode.port.postMessage({
      type: "pluck",
      voice: note.placement?.string ?? 0,
      frequency: note.pitch.toFrequency(),
      when,
    });

    const output = createGainNode(this.options.context, this.options.instrument, note);
    createEnvelope(
      output.gain,
      {
        attack: 0.01,
        release: 10,
      },
      when,
    );

    karplusStrongNode.connect(output);

    return { source: karplusStrongNode, output };
  }
}
