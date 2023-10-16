/* eslint-disable no-undef */

/**
 * @typedef {{ type: "start"; when?: number; durationSecs?: number }} StartEvent
 * @typedef {{ type: "stop"; }} StopEvent
 * @typedef {{ data: StopEvent | StartEvent }} KarplusStrongEvent
 *
 * @typedef {"white-noise" | "sine" | "noisy-sine"} ImpulseType
 * @typedef {"average" | "random-negation"} UpdateType
 * @typedef {{ impulseType?: ImpulseType; updateType?: UpdateType }} KarplusOptions
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
    this.updateType = options.processorOptions.updateType ?? "blend";

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
      output.fill(0.0);
      return true;
    }

    if (currentTime >= this.end) {
      output.fill(0.0);
      return false;
    }

    for (let i = 0; i < output.length; ++i, ++this.bufferIndex) {
      const frequency = parameters.frequency[i];
      const offset = Math.floor(sampleRate / frequency);

      let value = 0;
      if (this.bufferIndex < offset) {
        switch (this.impulseType) {
          case "white-noise":
            value = 2 * Math.random() - 1;
            break;
          case "sine":
            value = Math.sin((2 * Math.PI * this.bufferIndex) / offset);
            break;
          case "noisy-sine":
            // Sounds harp-like
            value = Math.random() * Math.sin((2 * Math.PI * this.bufferIndex) / offset);
            break;
        }
      } else {
        const delayed1 = this.buffer[(this.bufferIndex - offset) % this.buffer.length];
        const delayed2 = this.buffer[(this.bufferIndex - offset + 1) % this.buffer.length];

        switch (this.updateType) {
          case "blend": {
            value = 0.5 * (delayed2 + delayed1);
            break;
          }
          case "random-negation": {
            const sign = Math.random() < 0.5 ? -1 : 1;
            value = 0.5 * sign * (delayed2 + delayed1);
            break;
          }
        }
      }

      output[i] = value;
      this.buffer[this.bufferIndex % this.buffer.length] = value;
    }

    return true;
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
