/* eslint-disable no-undef */

/**
 * @typedef {{ type: "start"; when?: number; durationSecs?: number }} StartEvent
 * @typedef {{ type: "stop"; }} StopEvent
 * @typedef {{ data: StopEvent | StartEvent }} KarplusStrongEvent
 *
 * @typedef {"white-noise" | "sine" | "noisy-sine"} ImpulseType
 * @typedef {"average" | "random-negation"} FilterType
 *
 * @typedef {{ impulseType?: ImpulseType; filterType?: FilterType }} KarplusOptions
 * @typedef {Omit<AudioWorkletNodeOptions, "processorOptions"> & { processorOptions?: KarplusOptions }} KarplusStrongWorkletOptions
 */

/**
 * An audio worklet implementing the karplus-strong algorithm.
 *
 *  Initial Burst (e.g., white noise)
 *        |
 *        |
 *        •---[+]--------------------------------------------------------•------→ Output
 *             |                                                         |
 *             ↑                        Feedback loop                    ↓
 *             |                                                         |
 *             •--------[ LP Filter ]-------------------[ Delay ]--------•
 *
 * An initial burst of white noise is passed through a delay, which is fed into a low-pass (LP)
 * filter and recombined with the original signal.
 *
 * The length of the delay line determines the pitch of the output.
 *
 * @see https://ccrma.stanford.edu/~jos/pasp/Karplus_Strong_Algorithm.html
 * @see https://ccrma.stanford.edu/realsimple/faust_strings/
 */
class KarplusStrong extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "frequency",
        minValue: 1,
        maxValue: sampleRate / 2,
        defaultValue: 261.6, // middle C
        automationRate: "a-rate",
      },
    ];
  }

  /** @param {KarplusStrongWorkletOptions} options */
  constructor(options) {
    super();

    if (!options.processorOptions) {
      throw new Error("Missing processorOptions for KarplusStrong filter");
    }

    this.start = Number.POSITIVE_INFINITY;
    this.end = Number.POSITIVE_INFINITY;
    this.impulseType = options.processorOptions.impulseType ?? "white-noise";
    this.filterType = options.processorOptions.filterType ?? "average";

    this.stringTuningAllpass = new AllpassFilter();

    // Max  possible frequency is sampleRate / 2 (Nyquist frequency)
    this.buffer = new Float32Array(Math.ceil(sampleRate / 2));
    this.bufferIndex = 0;

    /** @param {KarplusStrongEvent} event */
    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "start": {
          this.start = event.data.when ?? currentTime - 0.001;
          this.end = event.data.durationSecs ? this.start + event.data.durationSecs : Number.POSITIVE_INFINITY;
          break;
        }
        case "stop": {
          this.end = currentTime;
          break;
        }
      }
    };
  }

  /**
   * @param inputs {Float32Array[][]}
   * @param outputs {Float32Array[][]}
   * @param parameters {{ frequency: number[] }}
   * @returns {boolean}
   */
  process(_inputs, outputs, parameters) {
    // Assuming mono output for now
    const output = outputs[0][0];

    if (currentTime < this.start) {
      output && output.fill(0.0);
      return true;
    }

    if (currentTime >= this.end) {
      output && output.fill(0.0);
      return false;
    }

    for (let i = 0; i < output.length; ++i, ++this.bufferIndex) {
      const frequency = parameters.frequency[i % parameters.frequency.length];
      const N = Math.floor(sampleRate / frequency);

      let value = 0;
      if (this.bufferIndex < N) {
        switch (this.impulseType) {
          case "white-noise":
            value = 2 * Math.random() - 1;
            break;
          case "sine":
            value = Math.sin((2 * Math.PI * this.bufferIndex) / N);
            break;
          case "noisy-sine":
            // Sounds harp-like
            value = Math.random() * Math.sin((2 * Math.PI * this.bufferIndex) / N);
            break;
        }

        // Pick-direction lowpass filter
        const p = 0; // TODO support changing this value with a param
        if (p > 0 && this.bufferIndex > 0) {
          value = (1 - p) * value + p * this.buffer[this.bufferIndex - 1];
        }

        // Pick-position comb filter
        const beta = 0; // TODO consider supporting various values here
        const combOffset = Math.floor((beta * sampleRate) / frequency + 0.5);
        if (combOffset > 0 && this.bufferIndex > combOffset) {
          value -= this.buffer[this.bufferIndex - combOffset];
        }
      } else {
        switch (this.filterType) {
          case "average": {
            const delayed1 = this.buffer[(this.bufferIndex - N) % this.buffer.length];
            const delayed2 = this.buffer[(this.bufferIndex - N + 1) % this.buffer.length];
            const p = 0.5 + 0.5 * Math.sqrt(frequency / sampleRate);
            value = p * delayed2 + (1 - p) * delayed1;
            break;
          }
          case "random-negation": {
            const delayed1 = this.buffer[(this.bufferIndex - N) % this.buffer.length];
            const delayed2 = this.buffer[(this.bufferIndex - N + 1) % this.buffer.length];
            const sign = Math.random() < 0.5 ? -1 : 1;
            value = 0.5 * sign * (delayed2 + delayed1);
            break;
          }
        }

        {
          // Allpass string tuning filter (some phase shifting to gets us closer to the desired frequency)
          // (see https://www.music.mcgill.ca/~gary/courses/papers/Jaffe-Extensions-CMJ-1983.pdf)
          const Pa_f1 = 0.5;
          const w1 = 2 * Math.PI * frequency;
          const Ts = 1 / sampleRate;
          const P1 = sampleRate / frequency;
          const N = Math.floor(P1 - Pa_f1 - 1e-5);
          const Pc_f1 = P1 - N - Pa_f1;

          // TODO cache `C` value if frequency didn't change
          const k = 0.5 * w1 * Ts;
          const C = Math.sin(k * (1 - Pc_f1)) / Math.sin(k * (1 + Pc_f1));

          value = this.stringTuningAllpass.compute(C, 1, -C, value);
        }
      }

      output[i] = value;
      this.buffer[this.bufferIndex % this.buffer.length] = value;
    }

    return true;
  }
}

class AllpassFilter {
  /**
   * Construct an allpass filter.
   */
  constructor() {
    this.previousInput = 0;
    this.previousOutput = 0;
  }

  /**
   * Compute the output of the filter for the given input.
   *
   * The value is computed from the following difference equation:
   *
   *    y[n] = a * x[n] + b * x[n - 1] + c * y[n - 1]
   *
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @param {number} input
   *
   * @returns {number}
   */
  compute(a, b, c, input) {
    const output = a * input + b * this.previousInput + c * this.previousOutput;
    this.previousInput = input;
    this.previousOutput = output;
    return output;
  }
}

registerProcessor("karplus-strong", KarplusStrong);
