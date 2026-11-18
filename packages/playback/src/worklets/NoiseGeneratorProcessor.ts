import { NoiseGenerator } from "../NoiseGenerator";

type NoiseGeneratorMessage = { type: "start"; when?: number; durationSecs?: number } | { type: "stop" };

/**
 * Audio worklet wrapper around {@link NoiseGenerator}. Entry point of the bundle served to the worklet scope.
 */
class NoiseGeneratorProcessor extends AudioWorkletProcessor {
  private readonly noise = new NoiseGenerator();

  static get parameterDescriptors() {
    return [];
  }

  constructor() {
    super();

    this.port.onmessage = (event: MessageEvent<NoiseGeneratorMessage>) => {
      switch (event.data.type) {
        case "start":
          this.noise.start(currentTime, event.data.when, event.data.durationSecs);
          break;
        case "stop":
          this.noise.stop(currentTime);
          break;
      }
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    // Assuming mono output for now
    return this.noise.process(outputs[0]?.[0], currentTime);
  }
}

registerProcessor("noise-generator", NoiseGeneratorProcessor);
