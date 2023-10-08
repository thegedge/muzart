import { InstrumentFactory } from "./InstrumentFactory";
import * as notation from "../notation";
import { Instrument } from "./instruments/Instrument";
import { OscillatorInstrument } from "./instruments/OscillatorInstrument";

/**
 * Default implementation of the InstrumentFactory interface.
 *
 * This factory uses simple web audio nodes, such as oscillators, to produce sound. Only a limited subset of
 * midi-like instruments can be produced with this factory.
 */
export class DefaultInstrumentFactory implements InstrumentFactory {
  private supportedInstruments: Record<
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

  get instruments() {
    return Object.values(this.supportedInstruments);
  }

  instrument(context: AudioContext, instrument: notation.Instrument): Instrument | null {
    const instrumentData = this.supportedInstruments[instrument.midiPreset];
    if (!instrumentData) {
      return null;
    }

    return new OscillatorInstrument({ context, instrument, type: instrumentData.type });
  }
}
