import { KarplusStrongString, type KarplusStrongOptions } from "../KarplusStrongString";

type KarplusStrongMessage = { type: "start"; when?: number; durationSecs?: number } | { type: "stop" };

type KarplusStrongWorkletOptions = Omit<AudioWorkletNodeOptions, "processorOptions"> & {
  processorOptions?: KarplusStrongOptions;
};

/**
 * Audio worklet wrapper around {@link KarplusStrongString}. Entry point of the bundle served to the worklet scope.
 */
class KarplusStrongProcessor extends AudioWorkletProcessor {
  private readonly string: KarplusStrongString;

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

  constructor(options: KarplusStrongWorkletOptions) {
    super();

    if (!options.processorOptions) {
      throw new Error("Missing processorOptions for KarplusStrong filter");
    }

    this.string = new KarplusStrongString(sampleRate, options.processorOptions);

    this.port.onmessage = (event: MessageEvent<KarplusStrongMessage>) => {
      switch (event.data.type) {
        case "start":
          this.string.start(currentTime, event.data.when, event.data.durationSecs);
          break;
        case "stop":
          this.string.stop(currentTime);
          break;
      }
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    // Assuming mono output for now
    return this.string.process(outputs[0]?.[0], currentTime, parameters.frequency);
  }
}

registerProcessor("karplus-strong", KarplusStrongProcessor);
