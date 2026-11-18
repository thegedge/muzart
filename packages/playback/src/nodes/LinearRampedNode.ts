import { AudioNode } from "./AudioNode";
import type { WebAudioNode } from "./node_helpers";

/**
 * A node that ramps in a given node based on a given gain parameter.
 */
export class LinearRampedNode extends AudioNode {
  readonly #inner: AudioNode;
  readonly #gain: AudioParam;
  readonly #rampSecs: number;

  constructor(inner: AudioNode, gain: AudioParam, rampSecs: number) {
    super();
    this.#inner = inner;
    this.#gain = gain;
    this.#rampSecs = rampSecs;
    inner.on("ended", () => {
      this.emit("ended").catch(console.error);
    });
  }

  start(when?: number, durationSecs?: number): void {
    const t = when ?? 0;
    this.#gain.setValueAtTime(0, t);
    this.#gain.linearRampToValueAtTime(1, t + this.#rampSecs);
    this.#inner.start(when, durationSecs);
  }

  stop(): void {
    this.#inner.stop();
  }

  dispose(): void {
    this.#inner.dispose();
  }

  get pitch(): AudioParam | undefined {
    return this.#inner.pitch;
  }

  get raw(): WebAudioNode {
    return this.#inner.raw;
  }
}
