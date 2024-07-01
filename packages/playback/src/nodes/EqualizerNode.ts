import { AudioNode } from "./AudioNode";
import { WebAudioNode } from "./node_helpers";

export interface EqualizerOptions {
  /** The audio context to use for the equalizer node. */
  context: AudioContext;

  /** The gain applied to the low frequencies. */
  lowGain?: number;

  /** The gain applied to the mid frequencies. */
  midGain?: number;

  /** The gain applied to the high frequencies. */
  highGain?: number;
}

/**
 * An equalizer node that adjusts low, mid, and high frequencies.
 */
export class EqualizerNode extends AudioNode {
  #active = false;

  #lo: WebAudioNode;
  #mid1: WebAudioNode;
  #mid2: WebAudioNode;
  #mid3: WebAudioNode;
  #hi: WebAudioNode;

  constructor(readonly options: EqualizerOptions) {
    super();

    this.#lo = new BiquadFilterNode(options.context, {
      type: "lowshelf",
      frequency: 200,
      gain: 20 * Math.log(options.lowGain ?? 1),
    });

    this.#mid1 = new BiquadFilterNode(options.context, {
      type: "peaking",
      frequency: 1400,
      Q: 10,
      gain: 20 * Math.log(options.midGain ?? 1),
    });

    this.#mid2 = new BiquadFilterNode(options.context, {
      type: "peaking",
      frequency: 2600,
      Q: 10,
      gain: 20 * Math.log(options.midGain ?? 1),
    });

    this.#mid3 = new BiquadFilterNode(options.context, {
      type: "peaking",
      frequency: 3800,
      Q: 10,
      gain: 20 * Math.log(options.midGain ?? 1),
    });

    this.#hi = new BiquadFilterNode(options.context, {
      type: "highshelf",
      frequency: 5000,
      gain: 20 * Math.log(options.highGain ?? 1),
    });

    this.#lo.connect(this.#mid1);
    this.#mid1.connect(this.#mid2);
    this.#mid2.connect(this.#mid3);
    this.#mid3.connect(this.#hi);
  }

  start(_when?: number, _durationSecs?: number) {
    this.#active = true;
    // TODO these are filters, so they don't have a start/stop. Refactor AudioNode into three types (source, sink)
  }

  stop() {
    if (this.#active) {
      this.#lo.disconnect();
      this.#mid1.disconnect();
      this.#mid2.disconnect();
      this.#mid3.disconnect();
      this.#hi.disconnect();

      this.#active = false;
      this.emit("ended").catch(console.error);
    }
  }

  dispose() {
    this.stop();
  }

  // TODO this is all pretty meh. I think we need a raw input/output

  get raw() {
    return this.#lo;
  }

  get pitch() {
    return undefined;
  }

  connect(destination: AudioNode): this {
    this.#hi.connect(destination.raw);
    return this;
  }
}
