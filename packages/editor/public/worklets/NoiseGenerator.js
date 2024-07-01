/* eslint-disable no-undef */

/**
 * @typedef {{ type: "start"; when?: number; durationSecs?: number }} NoiseGeneratorStartEvent
 * @typedef {{ type: "stop"; }} NoiseGeneratorStopEvent
 * @typedef {{ data: NoiseGeneratorStopEvent | NoiseGeneratorStartEvent }} Events
 *
 * @typedef {{ }} Options
 * @typedef {Omit<AudioWorkletNodeOptions, "processorOptions"> & { processorOptions?: Options }} NoiseGeneratorWorkletOptions
 */

/**
 * Generates white noise on
 */
class NoiseGenerator extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [];
  }

  /** @param {NoiseGeneratorWorkletOptions} _options */
  constructor(_options) {
    super();

    this.start = Number.POSITIVE_INFINITY;
    this.end = Number.POSITIVE_INFINITY;

    /** @param {Events} event */
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
   * @param _inputs {Float32Array[][]}
   * @param outputs {Float32Array[][]}
   * @param _parameters {unknown}
   *
   * @returns {boolean}
   */
  process(_inputs, outputs, _parameters) {
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

    for (let i = 0; i < output.length; ++i) {
      output[i] = 2 * Math.random() - 1;
    }

    return true;
  }
}

registerProcessor("noise-generator", NoiseGenerator);
