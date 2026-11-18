import { AudioNode } from "./AudioNode";
import { WrappedNode } from "./WrappedNode";
import type { WebAudioNode } from "./node_helpers";

/** A composite node chain with at least a distinct input/output chain */
export type Chain<T> = [T, ...T[], T];

/**
 * A node that is composed of a separate input and output node.
 */
export class CompositeNode extends AudioNode {
  static compose = (...nodes: Chain<AudioNode | WebAudioNode>): CompositeNode => {
    const muzartNodes = nodes.map((current) => WrappedNode.from(current)) as Chain<AudioNode>;

    let previous: AudioNode | null = null;
    for (const node of muzartNodes) {
      if (previous) {
        previous.connect(node);
      }

      previous = node;
    }

    return new CompositeNode(...muzartNodes);
  };

  #input: AudioNode;
  #output: AudioNode;
  #chain: AudioNode[];
  #active = false;

  /**
   * Construct a composite node from the given chain of nodes.
   *
   * @param nodes - the chain of nodes, with the first element being the input and the last the output
   */
  constructor(...nodes: Chain<AudioNode>) {
    super();
    this.#chain = nodes;
    this.#input = nodes[0];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- `Chain` ensures at least two elements
    this.#output = nodes.at(-1)!;

    // The source (input) is what knows when the sound is over (e.g. a worklet's duration timer)
    this.#input.on("ended", () => this.#end());
  }

  start(when?: number, durationSecs?: number): void {
    this.#active = true;
    this.#input.start(when, durationSecs);
  }

  stop(): void {
    if (this.#active) {
      this.#output.stop();
      this.#end();
    }
  }

  #end(): void {
    if (this.#active) {
      this.#active = false;
      this.emit("ended").catch(console.error);
    }
  }

  dispose(): void {
    this.#chain.forEach((node) => node.dispose());
  }

  /** @override */
  get rawInput(): WebAudioNode {
    return this.#input.raw;
  }

  get raw(): WebAudioNode {
    return this.#output.raw;
  }

  get pitch(): AudioParam | undefined {
    return this.#input.pitch ?? this.#output.pitch;
  }
}
