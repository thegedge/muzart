/**
 * An attack, decary, sustain, release envelope.
 *
 * All params are in seconds.
 *
 * @see https://en.wikipedia.org/wiki/Envelope_(music)#ADSR
 */
export interface Envelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

/**
 * Create an "attack, decay, sustain, release" envelope for a given parameter.
 */
export const createEnvelope = (param: AudioParam, envelope: Partial<Envelope>, when: number) => {
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
