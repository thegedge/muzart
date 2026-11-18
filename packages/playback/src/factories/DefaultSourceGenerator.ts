import * as notation from "@muzart/notation";
import { Drum } from "../generators/Drum";
import { PluckedString, type PluckedStringOptions } from "../generators/PluckedString";
import { SimpleOscillator, type OscillatorOptions } from "../generators/SimpleOscillator";
import { CompositeNode } from "../nodes/CompositeNode";
import { EqualizerNode } from "../nodes/EqualizerNode";
import type { MidiInstrument, SourceGenerator, SourceGeneratorFactory } from "../types";
import { LinearRampedNode } from "../nodes/LinearRampedNode";

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
  options: Record<string, never>;
};

type CustomGenerator = {
  type: "custom";
  construct: (
    factory: DefaultSourceGenerator,
    context: AudioContext,
    instrument: notation.Instrument,
  ) => SourceGenerator;
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

          // Soften the mid and high frequencies to make the guitar sound more like nylon strings? I don't know what I'm done.
          return {
            generate(note) {
              const source = generator.generate(note);
              return CompositeNode.compose(
                source,
                new EqualizerNode({
                  context,
                  lowGain: 3,
                  midGain: 0.0001,
                  highGain: 0.0001,
                }),
              );
            },
          };
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

    // TODO eventually make this distortion, and have overdrive be different

    30: {
      name: "Electric Guitar (overdrive)",
      generator: {
        type: "custom",
        construct(factory, context, instrument) {
          const generator = factory.generatorForData(context, instrument, {
            type: "plucked-string",
            options: {
              impulseType: "white-noise",
              filterType: "gaussian",
            },
          });

          // Amp-like: gentle early stages, with a hard final stage
          const softCurve = softClipCurve(2048, 2.5, 0.03);
          const midCurve = softClipCurve(2048, 4, 0.06);
          const hardCurve = softClipCurve(2048, 10, 0.1);

          return {
            createBus() {
              // Pre-shaping (think Tube Screamer, or something like that!)
              const drive = new GainNode(context, { gain: 30 });
              const drive2 = new GainNode(context, { gain: 3 });
              const fizz1 = new BiquadFilterNode(context, { type: "lowpass", frequency: 5500, Q: Math.SQRT1_2 });
              const fizz2 = new BiquadFilterNode(context, { type: "lowpass", frequency: 5000, Q: Math.SQRT1_2 });
              const tight = new BiquadFilterNode(context, { type: "highpass", frequency: 80, Q: Math.SQRT1_2 });

              // Distortion clipping
              const distortion = new WaveShaperNode(context, { oversample: "4x", curve: softCurve });
              const distortion2 = new WaveShaperNode(context, { oversample: "4x", curve: midCurve });
              const distortion3 = new WaveShaperNode(context, { oversample: "4x", curve: hardCurve });

              // Post-shaping (cabinet modeling)
              const cabHighpass = new BiquadFilterNode(context, { type: "highpass", frequency: 80, Q: Math.SQRT1_2 });
              const cabResonance = new BiquadFilterNode(context, {
                type: "peaking",
                frequency: 110,
                gain: 3.5,
                Q: 1.8,
              });
              const boxCut = new BiquadFilterNode(context, { type: "peaking", frequency: 400, gain: -4, Q: 1 });
              const presence = new BiquadFilterNode(context, { type: "peaking", frequency: 2500, gain: 3, Q: 1.2 });
              const cabLowpass1 = new BiquadFilterNode(context, { type: "lowpass", frequency: 4800, Q: 0.6 });
              const cabLowpass2 = new BiquadFilterNode(context, { type: "lowpass", frequency: 4800, Q: 0.9 });
              const trim = new GainNode(context, { gain: 0.13 });

              return CompositeNode.compose(
                drive,
                distortion,
                fizz1,
                tight,
                distortion2,
                fizz2,
                drive2,
                distortion3,
                cabHighpass,
                cabResonance,
                boxCut,
                presence,
                cabLowpass1,
                cabLowpass2,
                trim,
              );
            },

            generate(note) {
              // Avoid the clicks/plucks at the beginning
              const attack = new GainNode(context, { gain: 0 });

              // Pre-shaping
              const preHighpass = new BiquadFilterNode(context, { type: "highpass", frequency: 55, Q: Math.SQRT1_2 });
              const midHump = new BiquadFilterNode(context, { type: "peaking", frequency: 750, gain: 3, Q: 0.6 });
              const sustain = new DynamicsCompressorNode(context, {
                threshold: -34,
                knee: 20,
                ratio: 4,
                attack: 0.01,
                release: 0.35,
              });

              const pitchScale = (330 / Math.min(Math.max(note.pitch.toFrequency(), 82), 660)) ** 0.5;
              const level = new GainNode(context, { gain: pitchScale });

              const chain = CompositeNode.compose(
                generator.generate(note),
                attack,
                preHighpass,
                midHump,
                sustain,
                level,
              );

              return new LinearRampedNode(chain, attack.gain, 0.01);
            },
          };
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
    const instrumentData =
      this.#supportedInstruments[instrument instanceof notation.PercussionInstrument ? 119 : instrument.midiPreset];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!instrumentData) {
      return null;
    }

    return this.generatorForData(context, instrument, instrumentData.generator);
  }

  generatorForData(context: AudioContext, instrument: notation.Instrument, generator: GeneratorType): SourceGenerator {
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

/**
 * Build an odd-symmetric soft-clipping transfer curve
 *
 * Properties:
 * - `f(0) = 0`
 * - Normalized to [-1, 1]
 * - Exactly `tanh(k * x) / tanh(k)` when bias = 0
 */
const softClipCurve = (n: number, k: number, bias: number): Float32Array<ArrayBuffer> => {
  const offset = Math.tanh(k * bias);
  const norm = Math.max(Math.tanh(k * (1 + bias)) - offset, Math.tanh(k * (1 - bias)) + offset);
  const curve = new Float32Array(n);
  for (let i = 0; i < n; ++i) {
    const x = (2 * i) / (n - 1) - 1;
    curve[i] = (Math.tanh(k * (x + bias)) - offset) / norm;
  }
  return curve;
};
