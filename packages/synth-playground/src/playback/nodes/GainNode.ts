import { AudioNode } from "../AudioNode";
import { AudioParam } from "../AudioParam";

export class GainNode extends AudioNode {
  private node: globalThis.GainNode;

  constructor(readonly context: AudioContext) {
    const node = context.createGain();
    super([new AudioParam("gain", node.gain)]);
    this.node = node;
  }

  start(_when?: number, _durationSecs?: number): void {
    // gain nodes are always active
  }

  stop(): void {
    // gain nodes don't need to be stopped
  }

  get hasInput(): boolean {
    return true;
  }

  get hasOutput(): boolean {
    return true;
  }

  connect(input: AudioNode | AudioParam): this {
    super.connect(input);

    if (input instanceof AudioParam) {
      this.node.connect(input.raw);
    } else if (input instanceof AudioNode) {
      this.node.connect(input.node);
    }
  }
}
