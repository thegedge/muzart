import { AudioNode } from "./AudioNode";

/**
 * A node that wraps an audio worklet.
 */
export class AudioWorkletNode extends AudioNode {
  #active = false;

  private readonly node: globalThis.AudioWorkletNode;

  constructor(node: globalThis.AudioWorkletNode) {
    super();
    this.node = node;
  }

  start(when?: number, durationSecs?: number): void {
    this.#active = true;
    this.node.port.postMessage({
      type: "start",
      when,
      durationSecs,
    });

    if (durationSecs !== undefined) {
      const now = this.node.context.currentTime;
      const stopTime = Math.max(0, (when ?? now) + durationSecs - now) * 1000;
      setTimeout(() => this.stop(), stopTime);
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
    return this.node.parameters.get("frequency");
  }
}
