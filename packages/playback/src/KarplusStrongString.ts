export type ImpulseType = "white-noise" | "sine" | "noisy-sine";
export type FilterType = "average" | "gaussian" | "random-negation";

export type KarplusStrongOptions = {
  /**
   * Impulse type to use for "initializing" the string.
   *
   * @defaultValue "white-noise"
   */
  impulseType?: ImpulseType;

  /**
   * Filter to use for samples in the Karplus-Strong feedback loop.
   *
   * @defaultValue "average"
   */
  filterType?: FilterType;

  /**
   * Random number generator
   *
   * @defaultValue {@link Math.random}
   */
  random?: () => number;
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
  /** The sample rate */
  private readonly sampleRate: number;
  private readonly impulseType: ImpulseType;
  private readonly filterType: FilterType;

  /**
   * Buffer of generated samples
   *
   * We need to store at least a period's worth of samples to be able to do a feedback loop
   */
  private readonly buffer: Float32Array;

  /** RNG used for generating impulses (useful for testing) */
  private readonly random: () => number;

  /** Index into the sample buffer where the next sample will be generated */
  private bufferIndex = 0;

  /** The current frequency, in Hz */
  private tunedFrequency = Number.NaN;

  /** Lag, in sample count, for the tap in the delay loop */
  private tapDelay: number;

  /** The loop filter delay, in samples */
  private readonly filterDelay: number;

  /** How many samples the loop filter reads */
  private readonly filterTaps: number;

  /** Coefficient for the allpass filter providing a fractional delay */
  private allpassCoefficient = 0;

  /** Previous input value to the allpass filter */
  private allpassIn = 0;

  /** Previous output value from the allpass filter */
  private allpassOut = 0;

  /** When the string starts vibrating (the impulse) */
  private startTime = Number.POSITIVE_INFINITY;

  /** When the string stops vibrating */
  private endTime = Number.POSITIVE_INFINITY;

  /**
   * Construct a string modeled using the Karplus-Strong method.
   *
   * @param sampleRate sample rate in Hz
   * @param options string character
   * @param random source of randomness in [0, 1), replaceable to make the output deterministic
   */
  constructor(sampleRate: number, options: KarplusStrongOptions = {}) {
    this.sampleRate = sampleRate;
    this.random = options.random ?? Math.random;
    this.impulseType = options.impulseType ?? "white-noise";
    this.filterType = options.filterType ?? "average";
    this.filterTaps = this.filterType === "gaussian" ? 5 : 2;
    this.filterDelay = this.filterType === "gaussian" ? 2 : 0.5;
    this.tapDelay = this.filterTaps;
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
   *
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
      const hz = frequency[i % frequency.length];
      const offset = Math.floor(this.sampleRate / hz);

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
        if (hz !== this.tunedFrequency) {
          this.retune(hz);
        }

        // Read the taps starting `tapDelay` samples back. Indices before the start of the note read the (zeroed) tail
        // of the ring buffer.
        const base = (this.bufferIndex - this.tapDelay + length) % length;
        const delayed1 = this.buffer[base];
        const delayed2 = this.buffer[(base + 1) % length];

        let filtered = 0;
        switch (this.filterType) {
          case "average": {
            filtered = 0.5 * (delayed2 + delayed1);
            break;
          }
          case "gaussian": {
            const delayed3 = this.buffer[(base + 2) % length];
            const delayed4 = this.buffer[(base + 3) % length];
            const delayed5 = this.buffer[(base + 4) % length];
            filtered = (1 * (delayed1 + delayed5) + 4 * (delayed2 + delayed4) + 6 * delayed3) * 0.0625;
            break;
          }
          case "random-negation": {
            const sign = this.random() < 0.5 ? -1 : 1;
            filtered = 0.5 * sign * (delayed2 + delayed1);
            break;
          }
        }

        // First-order allpass supplies the fractional part of the delay.
        value = this.allpassCoefficient * (filtered - this.allpassOut) + this.allpassIn;
        this.allpassIn = filtered;
        this.allpassOut = value;
      }

      output[i] = value;
      this.buffer[this.bufferIndex % length] = value;
    }

    return true;
  }

  /**
   * Update internal state to ensure we emit a signal at the given frequency.
   *
   * Because we're working with a discrete number of samples (integral), we don't perfectly achieve
   * the desired frequency. This function is all about computing some internal state that we use to
   * get us closer to that frequency by compensating for the (otherwise lost) fractional portion of
   * the period. For example, at 440 Hz we have a period of 109.09 samples.
   *
   * @see https://ccrma.stanford.edu/~jos/pasp/First_Order_Allpass_Interpolation.html
   * @see
   */
  private retune(frequency: number) {
    this.tunedFrequency = frequency;

    // We have this:
    //
    //    period = tapDelay - filterDelay + fraction
    //
    // If we rearrange that
    //
    //    period + filterDelay = tapDelay + fraction
    //
    // That left-hand side is what we're storing into target, but notice that it's also equivalent
    // to the tapDelay (integer) and the fractional bit we would otherwise lose.
    const target = this.sampleRate / frequency + this.filterDelay;

    // Eliminate the whole part of the delay from the allpass filter
    //
    // This calculation leaves the allpass filter delay between 0.5 and 1.5 samples, where it
    // behaves best ("behave" meaning stable, with little frequency-dependent delay)
    this.tapDelay = Math.min(Math.max(Math.floor(target - 0.5), this.filterTaps), this.buffer.length - this.filterTaps);

    // Allpass filter:
    //
    //   a * (x_current - y_previous) + x_previous
    //
    // where x is the input samples and y the output samples.
    //
    // The computed coefficient (a in the above formula) gives us `fraction` samples of delay at this pitch.
    // We use `sin` instead of an approximation.
    //
    // See formula (16) of https://musicweb.ucsd.edu/~trsmyth/papers/KSExtensions.pdf
    const omega = (2 * Math.PI * frequency) / this.sampleRate; // angular frequency (radians per sample)
    const fraction = Math.max(target - this.tapDelay, 0.1); // keep away from 0 for stability
    const denominator = Math.sin(((1 + fraction) * omega) / 2);
    if (Math.abs(denominator) > 1e-6) {
      this.allpassCoefficient = Math.sin(((1 - fraction) * omega) / 2) / denominator;
    } else {
      this.allpassCoefficient = 0;
    }
  }
}
