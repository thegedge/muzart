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
    29: {
      name: "Distortion Guitar",
      midiPreset: 29,
      type: "square",
    },
    30: {
      name: "Acoustic Guitar",
      midiPreset: 30,
      type: "triangle",
    },
    34: {
      name: "Bass Guitar",
      midiPreset: 34,
      type: "sine",
    },
    81: {
      name: "Sawtooth Wave",
      midiPreset: 81,
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
