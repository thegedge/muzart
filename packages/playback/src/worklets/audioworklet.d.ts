/**
 * Minimal declarations for the global scope in {@link AudioWorklet}, which the DOM lib does not describe.
 *
 * @see https://webaudio.github.io/web-audio-api/#AudioWorkletGlobalScope
 */

/** Sample rate of the BaseAudioContext the worklet belongs to. */
declare const sampleRate: number;

/** Time, in seconds, of the first sample of the block currently being rendered. */
declare const currentTime: number;

declare class AudioWorkletProcessor {
  readonly port: MessagePort;

  constructor(options?: AudioWorkletNodeOptions);
}

declare function registerProcessor(name: string, processorCtor: new (options: never) => AudioWorkletProcessor): void;
