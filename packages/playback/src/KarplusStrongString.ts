export type ImpulseType = "white-noise" | "sine" | "noisy-sine";
export type FilterType = "average" | "gaussian" | "random-negation";

export type KarplusStrongOptions = {
  impulseType?: ImpulseType;
  filterType?: FilterType;
};

/**
 * A single plucked string using the karplus-strong algorithm.
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
 * Free of any AudioWorklet globals so it can be driven directly (e.g. from tests).
 *
 * @see https://ccrma.stanford.edu/~jos/pasp/Karplus_Strong_Algorithm.html
 * @see https://ccrma.stanford.edu/realsimple/faust_strings/
 */
export class KarplusStrongString {
  private readonly sampleRate: number;
  private readonly random: () => number;
  private readonly impulseType: ImpulseType;
  private readonly filterType: FilterType;
  private readonly buffer: Float32Array;
  private bufferIndex = 0;
  private startTime = Number.POSITIVE_INFINITY;
  private endTime = Number.POSITIVE_INFINITY;

  /**
   * @param sampleRate sample rate in Hz
   * @param options string character
   * @param random source of randomness in [0, 1), replaceable to make the output deterministic
   */
  constructor(sampleRate: number, options: KarplusStrongOptions = {}, random: () => number = Math.random) {
    this.sampleRate = sampleRate;
    this.random = random;
    this.impulseType = options.impulseType ?? "white-noise";
    this.filterType = options.filterType ?? "average";
    this.buffer = new Float32Array(Math.ceil(sampleRate / 2));
  }

  /**
   * Begin plucking the string.
   *
   * @param now current time in seconds
   * @param when time at which to start; defaults to just before now
   * @param durationSecs how long to sound for; omitted means until stopped
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
   * @param output mono output block
   * @param now time in seconds of the first sample of the block
   * @param frequency per-sample frequency in Hz; a shorter array (e.g. a single value for k-rate) is repeated
   * @returns false once the string has ended and the processor can be discarded
   */
  process(output: Float32Array | undefined, now: number, frequency: ArrayLike<number>): boolean {
    if (now < this.startTime) {
      output?.fill(0.0);
      return true;
    }

    if (now >= this.endTime) {
      output?.fill(0.0);
      return false;
    }

    if (!output) {
      return true;
    }

    const length = this.buffer.length;
    for (let i = 0; i < output.length; ++i, ++this.bufferIndex) {
      const offset = Math.floor(this.sampleRate / frequency[i % frequency.length]);

      let value = 0;
      if (this.bufferIndex < offset) {
        switch (this.impulseType) {
          case "white-noise":
            value = 2 * this.random() - 1;
            break;
          case "sine":
            value = Math.sin((2 * Math.PI * this.bufferIndex) / offset);
            break;
          case "noisy-sine":
            // Sounds harp-like
            value = this.random() * Math.sin((2 * Math.PI * this.bufferIndex) / offset);
            break;
        }
      } else {
        switch (this.filterType) {
          case "average": {
            const delayed1 = this.buffer[(this.bufferIndex - offset) % length];
            const delayed2 = this.buffer[(this.bufferIndex - offset + 1) % length];
            value = 0.5 * (delayed2 + delayed1);
            break;
          }
          case "gaussian": {
            const delayed1 = this.buffer[(this.bufferIndex - offset) % length];
            const delayed2 = this.buffer[(this.bufferIndex - offset + 1) % length];
            const delayed3 = this.buffer[(this.bufferIndex - offset + 2) % length];
            const delayed4 = this.buffer[(this.bufferIndex - offset + 3) % length];
            const delayed5 = this.buffer[(this.bufferIndex - offset + 4) % length];
            value = (1 * (delayed1 + delayed5) + 4 * (delayed2 + delayed4) + 6 * delayed3) * 0.0625;
            break;
          }
          case "random-negation": {
            const delayed1 = this.buffer[(this.bufferIndex - offset) % length];
            const delayed2 = this.buffer[(this.bufferIndex - offset + 1) % length];
            const sign = this.random() < 0.5 ? -1 : 1;
            value = 0.5 * sign * (delayed2 + delayed1);
            break;
          }
        }
      }

      output[i] = value;
      this.buffer[this.bufferIndex % length] = value;
    }

    return true;
  }
}
