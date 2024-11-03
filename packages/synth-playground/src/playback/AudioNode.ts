import type { AudioParam } from "./AudioParam";
import type { InputNode, OutputNode } from "./types";

export abstract class AudioNode implements InputNode<AudioNode>, OutputNode<AudioNode | AudioParam> {
  protected input: AudioNode | null = null;
  protected output: AudioNode | AudioParam | null = null;

  constructor(readonly parameters: ReadonlyArray<AudioParam> = []) {}

  /**
   * Start playing a node at a given time and with a given duration.
   *
   * @param when the time to start playing the note, or play immediately if not given
   * @param durationSecs optional duration to play the note for, overriding the note value
   */
  abstract start(when?: number, durationSecs?: number): void;

  /**
   * Immediately stop playing this node.
   */
  abstract stop(): void;

  /**
   * Whether or not this node has an input port.
   */
  abstract get hasInput(): boolean;

  /**
   * Whether or not this node has an output port.
   */
  abstract get hasOutput(): boolean;

  /**
   * Tell this audio node that another node wants to connect.
   */
  connectInput(output: AudioNode): void {
    this.input = output;
  }

  /**
   * Tell this audio node that its input node needs to be disconnected.
   */
  disconnectInput(): void {
    this.input = null;
  }

  /**
   * Connect to the given destination node.
   */
  connect(input: AudioNode | AudioParam): this {
    if (this.output) {
      this.disconnect();
    }

    this.output = input;
    input.connectInput(this);

    return this;
  }

  /**
   * Connect to the given destination node.
   */
  disconnect(): void {
    if (this.output) {
      this.output.disconnectInput();
      this.output = null;
    }
  }
}
