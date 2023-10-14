/* eslint-disable no-undef */

/**
 * @typedef {{ type: "stop"; }} StopEvent
 * @typedef {{ data: StopEvent }} KarplusStrongEvent
 *
 * @typedef {"white-noise" | "sine" | "noisy-sine"} ImpulseType
 * @typedef {"average" | "random-negation"} UpdateType
 * @typedef {{ frequency: number; when: number; impulseType?: ImpulseType; updateType?: UpdateType }} KarplusOptions
 * @typedef {Omit<AudioWorkletNodeOptions, "processorOptions"> & { processorOptions?: KarplusOptions }} KarplusStrongWorkletOptions
 */

/**
 * An audio worklet implementing the karplus-strong algorithm.
 *
 *  Initial Burst (e.g., white noise)
 *        |
 *        |
 *        •---[+]----------------------------------------------•------→ Output
 *             |                                               |
 *             ↑                Feedback loop                  ↓
 *             |                                               |
 *             •--------[ LP Filter ]---------[ Delay ]--------•
 *
 * An initial burst of white noise is passed through a delay, which is fed into a low-pass (LP)
 * filter and recombined with the original signal. The length of the delay line determines the
 * pitch of the output.
 *
 * @see https://ccrma.stanford.edu/~jos/pasp/Karplus_Strong_Algorithm.html
 * @see https://ccrma.stanford.edu/realsimple/faust_strings/
 * @see https://ccrma.stanford.edu/~jos/fp/One_Pole.html
 */
class KarplusStrong extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "brightness",
        minValue: 0,
        maxValue: 1,
        defaultValue: 1,
        automationRate: "k-rate",
      },
    ];
  }

  /** @param {KarplusStrongWorkletOptions} options */
  constructor(options) {
    super();

    if (!options.processorOptions) {
      throw new Error("Missing processorOptions for KarplusStrong filter");
    }

    this.frequency = options.processorOptions.frequency;
    this.when = options.processorOptions.when;
    this.impulseType = options.processorOptions.impulseType ?? "white-noise";
    this.updateType = options.processorOptions.updateType ?? "blend";

    this.buffer = this.bufferForFrequency(this.frequency);
    this.bufferIndex = 0;

    // One-pole low-pass filter constants. This coefficient is calculated with the cutoff frequency based on
    // the given frequency (see https://www.dspguide.com/ch19/2.htm)
    this.coefficient = Math.exp((-2 * Math.PI * this.frequency) / sampleRate);

    /** @param {KarplusStrongEvent} event */
    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "stop": {
          this.voice = undefined;
          break;
        }
      }
    };
  }

  /**
   * @param inputs {Float32Array[][]}
   * @param outputs {Float32Array[][]}
   * @param parameters {{ brightness: [number] }}
   * @returns {boolean}
   */
  process(_inputs, outputs, parameters) {
    // Assuming mono output for now
    const output = outputs[0][0];

    if (this.when > currentTime) {
      output.fill(0.0);
      return true;
    }

    let maxValue = 0;
    for (let i = 0; i < output.length; ++i, ++this.bufferIndex) {
      let value = 0;
      if (this.bufferIndex < this.buffer.length) {
        switch (this.impulseType) {
          case "white-noise":
            value = 2 * Math.random() - 1;
            break;
          case "sine":
            value = Math.sin((2 * Math.PI * this.bufferIndex) / this.buffer.length);
            break;
          case "noisy-sine":
            // Sounds harp-like
            value = Math.random() * Math.sin((2 * Math.PI * this.bufferIndex) / this.buffer.length);
            break;
        }
      } else {
        const delayed1 = this.buffer[this.bufferIndex % this.buffer.length];
        const delayed2 = this.buffer[(this.bufferIndex + 1) % this.buffer.length];

        switch (this.updateType) {
          case "blend": {
            // Simple low-pass filter. We ensure value is slight less than 1 to ensure dampening.
            const a = this.coefficient * clamp(1.0 - parameters.brightness[0], 0, 1);
            value = (0.999 - a) * delayed2 + a * delayed1;
            break;
          }
          case "random-negation": {
            const sign = Math.random() < 0.5 ? -1 : 1;
            value = 0.5 * sign * (delayed2 + delayed1);
            break;
          }
        }
      }

      maxValue = Math.max(maxValue, Math.abs(value));
      output[i] = value;
      this.buffer[this.bufferIndex % this.buffer.length] = value;
    }

    return maxValue > 0.001;
  }

  /**
   * @param {number} frequency
   * @private
   */
  bufferForFrequency(frequency) {
    const samplesPerPeriod = Math.ceil(sampleRate / frequency);
    return new Float32Array(samplesPerPeriod);
  }
}

/**
 * @param {number | undefined} value
 * @param {number} min
 * @param {number} max
 */
const clamp = (value, min, max) => {
  return value && Math.min(Math.max(value, min), max);
};

registerProcessor("karplus-strong", KarplusStrong);
