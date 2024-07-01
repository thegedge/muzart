import { AudioNode } from "./AudioNode";

/**
 * An "attack, decay, sustain, release" node.
 */
export class EnvelopeNode extends AudioNode {
  private gain: GainNode;

  constructor(
    context: AudioContext,
    readonly envelope: Envelope,
  ) {
    super();
    this.gain = context.createGain();
  }

  start(when?: number | undefined, _durationSecs?: number | undefined): void {
    createEnvelope(this.gain.gain, this.envelope, when ?? 0);
  }

  stop(): void {
    this.gain.disconnect();
  }

  dispose(): void {
    this.gain.disconnect();
  }

  get pitch(): AudioParam | undefined {
    return undefined;
  }

  get raw(): globalThis.AudioNode {
    return this.gain;
  }
}

/**
 * An attack, decary, sustain, release envelope.
 *
 * All params are in seconds.
 *
 * @see https://en.wikipedia.org/wiki/Envelope_(music)#ADSR
 */
export interface Envelope {
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
}

/**
 * Create an "attack, decay, sustain, release" envelope for a given parameter.
 */
const createEnvelope = (param: AudioParam, envelope: Envelope, when: number) => {
  const { attack, decay, sustain, release } = envelope;
  const value = param.value;

  let currentEnvelopeTime = when;
  if (attack) {
    param.setValueAtTime(0, currentEnvelopeTime);
    param.linearRampToValueAtTime(value, currentEnvelopeTime + attack);
    currentEnvelopeTime += attack;
  } else {
    param.setValueAtTime(value, currentEnvelopeTime);
  }

  if (decay) {
    // TODO use sustain value, if we can somehow set decibel output
    param.linearRampToValueAtTime(0.8 * value, currentEnvelopeTime + decay);
    currentEnvelopeTime += decay;
  }

  if (sustain) {
    currentEnvelopeTime += sustain;
  }

  if (release) {
    param.linearRampToValueAtTime(0, currentEnvelopeTime + release);
    currentEnvelopeTime += release;
  }
};
