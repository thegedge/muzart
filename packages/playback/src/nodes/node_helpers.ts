export type WebAudioNode = globalThis.AudioNode;

export type SourceNodes = OscillatorNode | AudioBufferSourceNode | AudioWorkletNode | ConstantSourceNode;

export const isSourceNode = (node: WebAudioNode): node is SourceNodes => {
  return (
    node instanceof OscillatorNode ||
    node instanceof AudioBufferSourceNode ||
    node instanceof AudioWorkletNode ||
    node instanceof ConstantSourceNode
  );
};
