export type WebAudioNode = globalThis.AudioNode;
export type WebAudioParam = globalThis.AudioParam;

export interface Node {
  name: string;
  hasInput: boolean;
  hasOutput: boolean;
}

export interface Port {
  name: string;
}

/**
 * A node that only
 */
export interface InputNode extends Node {
  hasInput: true;
}

export interface OutputNode extends Node {
  hasOutput: true;

  /**
   * Connect this node to a given input
   */
  connect(node: Node | Port): this;
}

export interface FilterNode extends InputNode, OutputNode {
  hasInput: true;
  hasOutput: true;
}
