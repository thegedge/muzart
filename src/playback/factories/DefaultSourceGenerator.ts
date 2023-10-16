import * as notation from "../../notation";
import { Drum, DrumOptions } from "../generators/Drum";
import { PluckedString, PluckedStringOptions } from "../generators/PluckedString";
import { OscillatorOptions, SimpleOscillator } from "../generators/SimpleOscillator";
import { CompositeNode } from "../nodes/CompositeNode";
import { WrappedNode } from "../nodes/WrappedNode";
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
            options: {},
          });

          if (!generator) {
            return null;
          }

          return {
            generate(note) {
              const source = generator.generate(note);

              // D4 and below + mids will be boosted, C7 and higher attenuated
              const loBoost = new WrappedNode(
                new BiquadFilterNode(context, { type: "lowshelf", frequency: 600, gain: 15 }),
              );
              const midBoost = new WrappedNode(
                new BiquadFilterNode(context, { type: "peaking", frequency: 200, Q: 100, gain: 15 }),
              );
              const hiAttenuate = new WrappedNode(
                new BiquadFilterNode(context, { type: "highshelf", frequency: 2000, gain: -20 }),
              );

              source.connect(loBoost);
              loBoost.connect(midBoost);
              midBoost.connect(hiAttenuate);

              return new CompositeNode(source, hiAttenuate);
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
        type: "oscillator",
        options: {
          oscillator: "square",
        },
      },
    },

    34: {
      name: "Electric Bass",
      generator: {
        type: "plucked-string",
        options: {},
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

    119: {
      name: "Synth Drum",
      generator: {
        type: "drum",
        options: {},
      },
    },
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
