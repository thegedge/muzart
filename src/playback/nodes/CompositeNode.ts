/* eslint-disable @typescript-eslint/no-explicit-any */
import { AudioNode } from "./AudioNode";
import { WebAudioNode } from "./node_helpers";

/**
 * A node that is composed of a separate input and output node.
 */
export class CompositeNode extends AudioNode {
  #input: AudioNode;
  #output: AudioNode;
  #active = false;

  constructor(input: AudioNode, output: AudioNode) {
    super();
    this.#input = input;
    this.#output = output;
  }

  start(when?: number | undefined, durationSecs?: number | undefined): void {
    this.#active = true;
    this.#input.start(when, durationSecs);
  }

  stop(): void {
    if (this.#active) {
      this.#output.stop();

      this.#active = false;
      this.emit("ended").catch(console.error);
    }
  }

  dispose(): void {
    this.#input.dispose();
    this.#output.dispose();
  }

  get raw(): WebAudioNode {
    return this.#output.raw;
  }

  get pitch(): AudioParam | undefined {
    return this.#input.pitch ?? this.#output.pitch;
  }
}
