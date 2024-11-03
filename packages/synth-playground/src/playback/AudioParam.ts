import type { AudioNode } from "./AudioNode";
import type { InputNode, WebAudioParam } from "./types";

export class AudioParam implements InputNode<AudioNode> {
  constructor(
    readonly name: string,
    readonly raw: WebAudioParam,
  ) {}

  /**
   * Get the default value for this param.
   */
  get defaultValue(): number {
    return this.raw.defaultValue;
  }

  /**
   * Get the current value of this param.
   */
  get value(): number {
    return this.raw.value;
  }

  /**
   * Tell this param that another node is connecting to it.
   */
  connectInput(_output: AudioNode): void {
    // nothing to do
  }

  /**
   * Tell this audio node that its input node needs to be disconnected.
   */
  disconnectInput(): void {
    // nothing to do
  }
}
