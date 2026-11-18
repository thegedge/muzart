import * as notation from "@muzart/notation";
import { AudioNode } from "./nodes/AudioNode";
import type { WebAudioNode } from "./nodes/node_helpers";

export type MidiInstrument = {
  name: string;
  midiPreset: number;
};

export type SourceGeneratorFactory = {
  generator(context: AudioContext, instrument: notation.Instrument): SourceGenerator | null;
  supportedInstruments: MidiInstrument[];
};

/**
 * A processing chain shared by every note of an instrument (e.g. an amp that clips the sum of all notes).
 */
export interface SourceBus {
  /** Notes are summed into this node */
  input: WebAudioNode;

  /** Connected to the instrument's output stage */
  output: WebAudioNode;

  /** Disconnect all nodes in the bus */
  dispose(): void;
}

export interface SourceGenerator {
  /**
   * Create a processing chain shared by all notes of an instrument.
   */
  createBus?(): AudioNode;

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
