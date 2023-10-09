/* eslint-disable no-undef */

/**
 * @typedef {{ type: "stop"; }} StopEvent
 * @typedef {{ data: StopEvent }} KarplusStrongEvent
 *
 * @typedef {{ bufferIndex: number; buffer: Float32Array; frequency: number; coefficient: number; when: number }} Voice
 * @typedef {Omit<AudioWorkletNodeOptions, "processorOptions"> & { processorOptions?: { frequency: number; when: number }}} KarplusStrongWorkletOptions
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

  /**
   * The active voices (i.e., strings that were plucked).
   *
   * @type {Voice | undefined}
   */
  voice = undefined;

  /** @param {KarplusStrongWorkletOptions} options */
  constructor(options) {
    super();

    if (!options.processorOptions) {
      throw new Error("Missing processorOptions for KarplusStrong filter");
    }

    const { frequency, when } = options.processorOptions;

    this.voice = {
      frequency,
      when,

      buffer: this.bufferForFrequency(frequency),
      bufferIndex: 0,

      // One-pole low-pass filter constants. The value of `a` is calculated with the cutoff frequency based on
      // the given frequency (see https://www.dspguide.com/ch19/2.htm)
      coefficient: Math.exp((-2 * Math.PI * frequency) / sampleRate),
    };

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
    output.fill(0.0);

    if (!this.voice || this.voice.when > currentTime) {
      return true;
    }

    for (let i = 0; i < output.length; ++i, ++this.voice.bufferIndex) {
      let value = 0;
      if (this.voice.bufferIndex < this.voice.buffer.length) {
        // Initial impulse, white noise
        value = 2 * Math.random() - 1;
      } else {
        const excitation = this.voice.buffer[(this.voice.bufferIndex - 1) % this.voice.buffer.length];
        const delayed = this.voice.buffer[this.voice.bufferIndex % this.voice.buffer.length];
        const a = this.voice.coefficient * parameters.brightness[0];

        // Simple low-pass filter. We ensure value is slight less than 1 to ensure dampening.
        value = (0.999 - a) * excitation + a * delayed;
      }

      output[i] += value;
      this.voice.buffer[this.voice.bufferIndex % this.voice.buffer.length] = value;
    }

    return true;
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

registerProcessor("karplus-strong", KarplusStrong);
