import * as notation from "@muzart/notation";
import { AudioWorkletNode } from "../nodes/AudioWorkletNode";
import { SourceGenerator } from "../types";

export interface DrumOptions {
  /** The audio context this generator will use */
  context: AudioContext;

  /** The instrument this generator will be used for */
  instrument: notation.Instrument;
}

/**
 * A generator that simulates a drum.
 */
export class Drum implements SourceGenerator {
  constructor(private options: DrumOptions) {}

  // TODO actually use the note

  generate(_note: notation.Note) {
    // TODO this only produces something that sounds like a kick drum, need all the other drum-y things
    // note.placement?.fret == 35  ==> kick drum
    // 35 Acoustic Bass Drum
    // 36 Electric Bass Drum
    // 37 Side Stick
    // 38 Acoustic Snare
    // 39 Hand Clap
    // 40 Electric Snare
    // 41 Low Floor Tom
    // 42 Closed Hi-hat
    // 43 High Floor Tom
    // 44 Pedal Hi-hat
    // 45 Low Tom
    // 46 Open Hi-hat
    // 47 Low-Mid Tom
    // 48 High-Mid Tom
    // 49 Crash Cymbal 1
    // 50 High Tom
    // 51 Ride Cymbal 1
    // 52 Chinese Cymbal
    // 53 Ride Bell
    // 54 Tambourine
    // 55 Splash Cymbal
    // 56 Cowbell
    // 57 Crash Cymbal 2
    // 58 Vibraslap
    // 59 Ride Cymbal 2
    // 60 High Bongo
    // 61 Low Bongo
    // 62 Mute High Conga
    // 63 Open High Conga
    // 64 Low Conga
    // 65 High Timbale
    // 66 Low Timbale
    // 67 High Agogô
    // 68 Low Agogô
    // 69 Cabasa
    // 70 Maracas
    // 71 Short Whistle
    // 72 Long Whistle
    // 73 Short Guiro
    // 74 Long Guiro
    // 75 Claves
    // 76 High Woodblock
    // 77 Low Woodblock
    // 78 Mute Cuica
    // 79 Open Cuica
    // 80 Mute Triangle
    // 81 Open Triangle

    const karplusStrongNode = new globalThis.AudioWorkletNode(this.options.context, "karplus-strong", {
      processorOptions: {
        frequency: 150,
        impulseType: "white-noise",
        updateType: "random-negation",
      },
    });

    return new AudioWorkletNode(karplusStrongNode);
  }
}
