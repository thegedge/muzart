import * as notation from "../notation";
import { Instrument } from "./instruments/Instrument";

export type InstrumentFactory = {
  instrument(context: AudioContext, instrument: notation.Instrument): Instrument | null;
  instruments: { name: string; midiPreset: number }[];
};
