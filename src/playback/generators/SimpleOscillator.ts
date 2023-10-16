import * as notation from "../../notation";
import { WrappedNode } from "../nodes/WrappedNode";
import { SourceGenerator } from "../types";

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

  generate(note: notation.Note) {
    const source = this.options.context.createOscillator();
    source.type = this.options.oscillator;
    source.frequency.value = note.pitch.toFrequency();
    return new WrappedNode(source);
  }
}
