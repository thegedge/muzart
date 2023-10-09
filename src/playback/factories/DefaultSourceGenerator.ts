import * as notation from "../../notation";
import { SourceGenerator } from "../types";
import { MidiInstrument, SourceGeneratorFactory } from "../types";
import { SimpleOscillator } from "../generators/SimpleOscillator";

/**
 * Default implementation of the InstrumentFactory interface.
 *
 * This factory uses simple web audio nodes, such as oscillators, to produce sound. Only a limited subset of
 * midi-like instruments can be produced with this factory.
 */
export class DefaultSourceGenerator implements SourceGeneratorFactory {
  #supportedInstruments: Record<
    number,
    {
      name: string;
      midiPreset: number;
      type: OscillatorType;
    }
  > = {
    25: {
      name: "Acoustic Guitar (nylon)",
      midiPreset: 25,
      type: "triangle",
    },
    26: {
      name: "Acoustic Guitar (steel)",
      midiPreset: 26,
      type: "triangle",
    },
    29: {
      name: "Electric Guitar (muted)",
      midiPreset: 29,
      type: "square",
    },
    30: {
      name: "Electric Guitar (overdrive)",
      midiPreset: 30,
      type: "sawtooth",
    },
    34: {
      name: "Electric Bass",
      midiPreset: 34,
      type: "sine",
    },
    81: {
      name: "Lead 1 (square)",
      midiPreset: 81,
      type: "square",
    },
    82: {
      name: "Lead 1 (sawtooth)",
      midiPreset: 82,
      type: "sawtooth",
    },
  };

  get supportedInstruments(): MidiInstrument[] {
    return Object.values(this.#supportedInstruments);
  }

  generator(context: AudioContext, instrument: notation.Instrument): SourceGenerator | null {
    const instrumentData = this.#supportedInstruments[instrument.midiPreset];
    if (!instrumentData) {
      return null;
    }

    return new SimpleOscillator({ context, instrument, type: instrumentData.type });
  }
}
