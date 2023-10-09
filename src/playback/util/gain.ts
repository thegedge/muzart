import * as notation from "../../notation";

/**
 * Create a gain for a given note on an instrument.
 */
export const createGainNode = (context: AudioContext, instrument: notation.Instrument, note: notation.Note) => {
  let value = instrument.volume * 0.2;
  switch (note.dynamic) {
    case notation.NoteDynamic.Pianississimo:
      value *= 0.1;
      break;
    case notation.NoteDynamic.Pianissimo:
      value *= 0.25;
      break;
    case notation.NoteDynamic.Piano:
      value *= 0.5;
      break;
    case notation.NoteDynamic.MezzoPiano:
      value *= 0.9;
      break;
    case notation.NoteDynamic.MezzoForte:
      value *= 1.1;
      break;
    case notation.NoteDynamic.Forte:
      value *= 1.5;
      break;
    case notation.NoteDynamic.Fortissimo:
      value *= 1.75;
      break;
    case notation.NoteDynamic.Fortississimo:
      value *= 2;
      break;
  }

  return new GainNode(context, { gain: value });
};
