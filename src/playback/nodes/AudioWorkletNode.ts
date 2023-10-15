import { AudioNode } from "./AudioNode";

/**
 * A node that wraps an audio worklet.
 */
export class AudioWorkletNode extends AudioNode {
  #active = false;

  constructor(private readonly node: globalThis.AudioWorkletNode) {
    super();
  }

  start(when?: number | undefined, durationSecs?: number | undefined): void {
    this.#active = true;
    this.node.port.postMessage({
      type: "start",
      when,
      durationSecs,
    });

    if (durationSecs !== undefined) {
      setTimeout(() => this.stop(), ((when ?? 0) + durationSecs) * 1000);
    }
  }

  stop(): void {
    if (this.#active) {
      this.#active = false;
      this.node.port.postMessage({ type: "stop" });
      this.emit("ended").catch(console.error);
    }
  }

  dispose(): void {
    this.stop();
    this.node.disconnect();
  }

  get raw(): globalThis.AudioNode {
    return this.node;
  }

  get pitch(): AudioParam | undefined {
    return undefined;
  }
}
