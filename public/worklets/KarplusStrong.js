/* eslint-disable no-undef */

// TODO it's really cool to have this as an audio worklet, but I think it'd be way better to make this work with regular Web Audio nodes

/**
 * @typedef {{ type: "start"; when?: number; durationSecs?: number }} StartEvent
 * @typedef {{ type: "stop"; }} StopEvent
 * @typedef {{ data: StopEvent | StartEvent }} KarplusStrongEvent
 *
 * @typedef {"white-noise" | "sine" | "noisy-sine"} ImpulseType
 * @typedef {"average" | "gaussian" | "random-negation"} FilterType
 * @typedef {"cubic_nonlinear"} ClipType
 *
 * @typedef {{ gain?: number; impulseType?: ImpulseType; filterType?: FilterType; clipType?: ClipType }} KarplusOptions
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
 *             •---[ Clipping ]---[ Gain ]---[ LP Filter ]---[ Delay ]---•
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
    this.clipType = options.processorOptions.clipType;
    this.gain = options.processorOptions.gain ?? 1;

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
        switch (this.filterType) {
          case "average": {
            const delayed1 = this.buffer[(this.bufferIndex - offset) % this.buffer.length];
            const delayed2 = this.buffer[(this.bufferIndex - offset + 1) % this.buffer.length];
            value = 0.5 * (delayed2 + delayed1);
            break;
          }
          case "gaussian": {
            const delayed1 = this.buffer[(this.bufferIndex - offset) % this.buffer.length];
            const delayed2 = this.buffer[(this.bufferIndex - offset + 1) % this.buffer.length];
            const delayed3 = this.buffer[(this.bufferIndex - offset + 2) % this.buffer.length];
            const delayed4 = this.buffer[(this.bufferIndex - offset + 3) % this.buffer.length];
            const delayed5 = this.buffer[(this.bufferIndex - offset + 4) % this.buffer.length];
            value = (1 * (delayed1 + delayed5) + 4 * (delayed2 + delayed4) + 6 * delayed3) * 0.0625;
            break;
          }
          case "random-negation": {
            const delayed1 = this.buffer[(this.bufferIndex - offset) % this.buffer.length];
            const delayed2 = this.buffer[(this.bufferIndex - offset + 1) % this.buffer.length];
            const sign = Math.random() < 0.5 ? -1 : 1;
            value = 0.5 * sign * (delayed2 + delayed1);
            break;
          }
        }
      }

      value *= this.gain;

      switch (this.clipType) {
        case "cubic_nonlinear":
          if (value <= -1) {
            value = -2 / 3.0;
          } else if (value >= 1) {
            value = 2 / 3.0;
          } else {
            value = value - Math.pow(value, 3) / 3.0;
          }
          break;
      }

      output[i] = value;
      this.buffer[this.bufferIndex % this.buffer.length] = value;
    }

    return true;
  }
}

registerProcessor("karplus-strong", KarplusStrong);
