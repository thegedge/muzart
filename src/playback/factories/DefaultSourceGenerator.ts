import * as notation from "../../notation";
import { Drum, DrumOptions } from "../generators/Drum";
import { PluckedString, PluckedStringOptions } from "../generators/PluckedString";
import { OscillatorOptions, SimpleOscillator } from "../generators/SimpleOscillator";
import { CompositeNode } from "../nodes/CompositeNode";
import { EqualizerNode } from "../nodes/EqualizerNode";
import { MidiInstrument, SourceGenerator, SourceGeneratorFactory } from "../types";

type OscillatorGenerator = {
  type: "oscillator";
  options: Omit<OscillatorOptions, "context" | "instrument">;
};

type PluckedStringGenerator = {
  type: "plucked-string";
  options: Omit<PluckedStringOptions, "context" | "instrument">;
};

type DrumGenerator = {
  type: "drum";
  options: Omit<DrumOptions, "context" | "instrument">;
};

type CustomGenerator = {
  type: "custom";
  construct: (
    factory: DefaultSourceGenerator,
    context: AudioContext,
    instrument: notation.Instrument,
  ) => SourceGenerator | null;
};

type GeneratorType = OscillatorGenerator | PluckedStringGenerator | DrumGenerator | CustomGenerator;

type InstrumentData = {
  name: string;
  generator: GeneratorType;
};

/**
 * Default implementation of the InstrumentFactory interface.
 *
 * This factory uses simple web audio nodes, such as oscillators, to produce sound. Only a limited subset of
 * midi-like instruments can be produced with this factory.
 */
export class DefaultSourceGenerator implements SourceGeneratorFactory {
  // Maps midi preset -> instrument data
  #supportedInstruments: Record<number, InstrumentData> = {
    25: {
      name: "Acoustic Guitar (nylon)",
      generator: {
        type: "custom",
        construct(factory, context, instrument) {
          const generator = factory.generatorForData(context, instrument, {
            type: "plucked-string",
            options: {
              filterType: "gaussian",
            },
          });

          if (!generator) {
            return null;
          }

          // Soften the mid and high frequencies to make the guitar sound more like nylon strings? I don't know what I'm done.
          return {
            generate(note) {
              const source = generator.generate(note);
              return (
                source &&
                CompositeNode.compose(
                  source,
                  new EqualizerNode({
                    context,
                    lowGain: 3,
                    midGain: 0.0001,
                    highGain: 0.0001,
                  }),
                )
              );
            },
          } as SourceGenerator;
        },
      },
    },

    26: {
      name: "Acoustic Guitar (steel)",
      generator: {
        type: "plucked-string",
        options: {},
      },
    },

    29: {
      name: "Electric Guitar (muted)",
      generator: {
        type: "plucked-string",
        options: {},
      },
    },

    30: {
      name: "Electric Guitar (overdrive)",
      generator: {
        type: "plucked-string",
        options: {
          impulseType: "white-noise",
          filterType: "gaussian",
          clipType: "cubic_nonlinear",
          gain: 25,
        },
      },
    },

    34: {
      name: "Electric Bass",
      generator: {
        type: "plucked-string",
        options: {
          impulseType: "noisy-sine",
          filterType: "gaussian",
        },
      },
    },

    47: {
      name: "Orchestral Harp",
      generator: {
        type: "plucked-string",
        options: {
          impulseType: "noisy-sine",
        },
      },
    },

    81: {
      name: "Lead 1 (square)",
      generator: {
        type: "oscillator",
        options: {
          oscillator: "square",
        },
      },
    },

    82: {
      name: "Lead 1 (sawtooth)",
      generator: {
        type: "oscillator",
        options: {
          oscillator: "sawtooth",
        },
      },
    },

    // TODO need to properly deal with this
    // 119: {
    //   name: "Synth Drum",
    //   generator: {
    //     type: "drum",
    //     options: {},
    //   },
    // },
  };

  get supportedInstruments(): MidiInstrument[] {
    return Object.entries(this.#supportedInstruments).map(([midiPreset, data]) => ({
      name: data.name,
      midiPreset: Number(midiPreset),
    }));
  }

  generator(context: AudioContext, instrument: notation.Instrument): SourceGenerator | null {
    const instrumentData = this.#supportedInstruments[instrument.type == "regular" ? instrument.midiPreset : 119];
    if (!instrumentData) {
      return null;
    }

    return this.generatorForData(context, instrument, instrumentData.generator);
  }

  generatorForData(
    context: AudioContext,
    instrument: notation.Instrument,
    generator: GeneratorType,
  ): SourceGenerator | null {
    switch (generator.type) {
      case "plucked-string":
        return new PluckedString({ context, instrument, ...generator.options });
      case "drum":
        return new Drum({ context, instrument, ...generator.options });
      case "oscillator":
        return new SimpleOscillator({ context, instrument, ...generator.options });
      case "custom":
        return generator.construct(this, context, instrument);
    }
  }
}
