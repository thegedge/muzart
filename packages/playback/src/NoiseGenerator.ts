/**
 * Generates white noise between a start and an end time. Free of any AudioWorklet globals so it can be driven
 * directly (e.g. from tests).
 */
export class NoiseGenerator {
  private startTime = Number.POSITIVE_INFINITY;
  private endTime = Number.POSITIVE_INFINITY;

  /**
   * Begin generating noise.
   *
   * @param now current time in seconds
   * @param when time at which to start; defaults to just before now
   * @param durationSecs how long to generate for; omitted means until stopped
   */
  start(now: number, when?: number, durationSecs?: number) {
    this.startTime = when ?? now - 0.001;
    this.endTime = durationSecs ? this.startTime + durationSecs : Number.POSITIVE_INFINITY;
  }

  stop(now: number) {
    this.endTime = now;
  }

  /**
   * Fill `output` with the next block of samples.
   *
   * @param now time in seconds of the first sample of the block
   * @returns false once the noise has ended and the processor can be discarded
   */
  process(output: Float32Array | undefined, now: number): boolean {
    if (now < this.startTime) {
      output?.fill(0.0);
      return true;
    }

    if (now >= this.endTime) {
      output?.fill(0.0);
      return false;
    }

    if (output) {
      for (let i = 0; i < output.length; ++i) {
        output[i] = 2 * Math.random() - 1;
      }
    }

    return true;
  }
}
