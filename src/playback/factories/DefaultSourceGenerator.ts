import { clamp } from "lodash";
import { svgPathProperties } from "svg-path-properties";
import * as notation from "../../notation";
import { Drum, DrumOptions } from "../generators/Drum";
import { PluckedString, PluckedStringOptions } from "../generators/PluckedString";
import { OscillatorOptions, SimpleOscillator } from "../generators/SimpleOscillator";
import { CompositeNode } from "../nodes/CompositeNode";
import { EqualizerNode } from "../nodes/EqualizerNode";
import { SourceGenerator, SourceGeneratorFactory, type MidiInstrument } from "../types";

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
        type: "custom",
        construct(factory, context, instrument) {
          const generator = factory.generatorForData(context, instrument, {
            type: "plucked-string",
            options: {
              impulseType: "white-noise",
              filterType: "average",
            },
          });

          const preHi = 2000;
          const preLo = 150;
          const postFrequency = 10000;
          const frequency = Math.sqrt(preHi - preLo);
          const Q = frequency / (preHi - preLo);

          // Create a curve that adjusts input/output like the following:
          //
          //  ^
          //  |
          //
          //  O             ----
          //  U            /
          //  T       _   /
          //         / \_/
          //  |     /
          //  v
          //           <- IN ->
          //
          const pathW = 210.65314;
          const pathH = 210.65159;
          const tx = 0.13639704;
          const ty = -45.30019;
          const path = new svgPathProperties(
            [
              ["M", 0.01371475 + tx, 255.93989 + ty],
              ["C", 2.4957989 + tx, 224.63855 + ty, 1.675487 + tx, 141.29052 + ty, 19.984253 + tx, 141.11971 + ty],
              ["c", 25.223313, -0.23531, 37.719831, 88.87167, 37.719831, 88.87167],
              ["c", 0, 0, 49.456596, -52.55299, 90.235276, -127.00691],
              ["c", 12.18918, -22.255104, 26.27927, -20.471436, 62.57729, -20.449335],
            ] as unknown as string, // svg-path-properties is happy with this array structure
          );

          const n = 512;

          const pathLength = path.getTotalLength();
          const points = [];
          for (let i = 0; i < n; ++i) {
            const x = i / (n - 1);
            const p = path.getPointAtLength(x * pathLength);
            points.push({ x: p.x / pathW, y: clamp(1.0 - p.y / pathH, 0, 1) });
          }

          const curve = new Float32Array(n);
          for (let i = 0, pointIndex = n - 1; 2 * i < n; ++i) {
            const t = 1.0 - (2 * i) / (n - 1);

            // Find the next point on the path whose x is lower than t
            while (pointIndex > 0 && t < points[pointIndex].x - 1e-10) {
              --pointIndex;
            }

            let value: number;
            if (pointIndex == n - 1) {
              value = points[pointIndex].y;
            } else {
              // Linearly interpolate between the two points
              const { x, y } = points[pointIndex];
              const { x: prevX, y: prevY } = points[pointIndex + 1];
              value = prevY + ((y - prevY) / (x - prevX)) * (t - prevX);
            }

            curve[i] = value;
            curve[n - i - 1] = value;
          }

          // Ensure the crossing points are zero to avoid "clicking"
          curve[n / 2] = 0;
          curve[n / 2 - 1] = 0;

          return generator;
          return {
            generate(note) {
              const pre = new BiquadFilterNode(context, {
                type: "bandpass",
                Q,
                frequency,
              });

              const distortion = new WaveShaperNode(context, {
                oversample: "none",
                curve,
              });

              const post = new BiquadFilterNode(context, {
                type: "lowpass",
                frequency: postFrequency,
                Q: Math.SQRT1_2,
              });

              const tone = new BiquadFilterNode(context, {
                type: "lowpass",
                frequency: Math.pow(350, 2),
                Q: Math.SQRT1_2,
              });

              return CompositeNode.compose(generator.generate(note), pre, distortion, post, tone);
            },
          } as SourceGenerator;
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
