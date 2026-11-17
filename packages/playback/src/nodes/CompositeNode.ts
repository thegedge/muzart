import { AudioNode } from "./AudioNode";
import { WrappedNode } from "./WrappedNode";
import type { WebAudioNode } from "./node_helpers";

/**
 * A node that is composed of a separate input and output node.
 */
export class CompositeNode extends AudioNode {
  static compose = (
    ...nodes: [AudioNode | WebAudioNode, ...(AudioNode | WebAudioNode)[], AudioNode | WebAudioNode]
  ): CompositeNode => {
    const muzartNodes = nodes.map((current) => {
      if (current instanceof AudioNode) {
        return current;
      }

      return new WrappedNode(current);
    });

    muzartNodes.reduce<AudioNode | null>((previous, current) => {
      if (previous) {
        previous.connect(current);
      }
      return current;
    }, null);

    return new CompositeNode(muzartNodes[0], muzartNodes[nodes.length - 1]);
  };

  #input: AudioNode;
  #output: AudioNode;
  #active = false;

  constructor(input: AudioNode, output: AudioNode) {
    super();
    this.#input = input;
    this.#output = output;
  }

  start(when?: number, durationSecs?: number): void {
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
