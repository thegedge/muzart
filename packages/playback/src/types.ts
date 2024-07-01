import * as notation from "@muzart/notation";
import { AudioNode } from "./nodes/AudioNode";

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
   */
  generate(note: notation.Note): AudioNode;
}

export interface InstrumentOptions {
  /** The audio context in which this instrument will be used */
  context: AudioContext;

  /** The instrument this sampler is derived from */
  instrument: notation.Instrument;

  /** A generator that can produce a source node for a given note */
  sourceGenerator: SourceGenerator;

  /**
   * An optional destination node for the instrument
   *
   * If not provided, the context destination will be used.
   */
  destination?: AudioNode;
}
