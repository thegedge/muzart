import * as notation from "../notation";
import * as notation from "../notation";
import { SourceGenerator } from "./types";

export type MidiInstrument = {
  name: string;
  midiPreset: number;
};

export type SourceGeneratorFactory = {
  generator(context: AudioContext, instrument: notation.Instrument): SourceGenerator | null;
  supportedInstruments: MidiInstrument[];
};
export interface SourceGenerator {
  /**
   * Generate a source node for a given note.
   *
   * @param note the note to generate a source for
   * @param when the time to start the note
   */
  generate(note: notation.Note, when: number): SourceNode;
}

export interface InstrumentOptions {
  /** The audio context in which this instrument will be used */
  context: AudioContext;

  /** The instrument this sampler is derived from */
  instrument: notation.Instrument;

  /** A generator that can produce a source node for a given note */
  sourceGenerator: SourceGenerator;
}

export interface SourceNode {
  /** The node actually playing the sound */
  source: OscillatorNode | AudioBufferSourceNode;

  /** The gain node in the chain */
  output: GainNode;
}
