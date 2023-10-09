import * as notation from "../../notation";
import { SourceGenerator, SourceNode } from "../types";
import { createEnvelope } from "../util/envelope";
import { createGainNode } from "../util/gain";

export interface OscillatorOptions {
  /** The audio context in which this oscillator will be used */
  context: AudioContext;

  /** The instrument this oscillator is derived from */
  instrument: notation.Instrument;

  /** The type of oscillator to use */
  oscillator: OscillatorType;
}

/**
 * A generator using a simple oscillator to produce sound.
 */
export class SimpleOscillator implements SourceGenerator {
  constructor(private options: OscillatorOptions) {}

  generate(note: notation.Note, when: number): SourceNode {
    const source = this.options.context.createOscillator();
    source.type = this.options.oscillator;
    source.frequency.value = note.pitch.toFrequency();

    const output = createGainNode(this.options.context, this.options.instrument, note);
    createEnvelope(
      output.gain,
      {
        attack: 0.01,
        release: 10,
      },
      when,
    );

    source.connect(output);

    return { source, output };
  }
}
