import { describe, expect, test } from "vitest";
import { KarplusStrongString, type FilterType } from "../src/KarplusStrongString";

const SAMPLE_RATE = 48000;
const BLOCK = 128;

/**
 * Deterministic PRNG
 *
 * @see https://github.com/cprosche/mulberry32
 */
const mulberry32 = (seed: number) => {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pluck = (filterType: FilterType = "average", durationSecs?: number, sampleRate = SAMPLE_RATE) => {
  const string = new KarplusStrongString(sampleRate, { filterType, random: mulberry32(1) });
  string.start(0, 0, durationSecs);
  return string;
};

/** Renders `seconds` of audio, a block at a time, asking for `frequencyAt(sampleIndex)` for every sample. */
const render = (
  string: KarplusStrongString,
  seconds: number,
  frequencyAt: (sample: number) => number,
  sampleRate = SAMPLE_RATE,
) => {
  const total = Math.ceil((seconds * sampleRate) / BLOCK) * BLOCK;
  const result = new Float32Array(total);
  for (let start = 0; start < total; start += BLOCK) {
    const block = new Float32Array(BLOCK);
    const frequencies = block.map((_, i) => frequencyAt(start + i));
    string.process(block, start / sampleRate, frequencies);
    result.set(block, start);
  }
  return result;
};

/**
 * Estimates the fundamental frequency of a periodic signal.
 *
 * Uses a method known as "Quadratic Interpolation of Spectral Peaks"
 *
 * @see https://ccrma.stanford.edu/~jos/sasp/Quadratic_Interpolation_Spectral_Peaks.html
 */
const estimateFrequency = (signal: Float32Array, sampleRate: number, nominalHz: number) => {
  const periods = 6;
  const period = sampleRate / nominalHz;
  const centre = Math.round(periods * period);

  /** Correlate the signal with a lagged version of itself */
  const autocorrelation = (lag: number) => {
    const start = Math.round(0.05 * sampleRate);
    const window = Math.round(4 * period);
    let xy = 0;
    let xx = 0;
    let yy = 0;
    for (let n = start; n < start + window; ++n) {
      xy += signal[n] * signal[n + lag];
      xx += signal[n] ** 2;
      yy += signal[n + lag] ** 2;
    }
    return xy / Math.sqrt(xx * yy);
  };

  let bestLag = centre;
  for (let lag = centre - 3; lag <= centre + 3; ++lag) {
    if (autocorrelation(lag) > autocorrelation(bestLag)) {
      bestLag = lag;
    }
  }

  const [before, peak, after] = [autocorrelation(bestLag - 1), autocorrelation(bestLag), autocorrelation(bestLag + 1)];

  const lag = bestLag + (0.5 * (before - after)) / (before - 2 * peak + after);
  return (periods * sampleRate) / lag;
};

const centsBetween = (actualHz: number, expectedHz: number) => 1200 * Math.log2(actualHz / expectedHz);

describe("KarplusStrongString", () => {
  describe("pitch", () => {
    test.each([
      { filterType: "average", hz: 110 },
      { filterType: "average", hz: 220 },
      { filterType: "random-negation", hz: 110 },
      { filterType: "gaussian", hz: 110 },
    ] as const)("process should sound near $hz Hz using the $filterType filter", ({ filterType, hz }) => {
      const string = pluck(filterType);
      const signal = render(string, 0.6, () => hz).subarray(Math.round(0.1 * SAMPLE_RATE));

      if (filterType !== "random-negation") {
        expect(Math.abs(centsBetween(estimateFrequency(signal, SAMPLE_RATE, hz), hz))).toBeLessThan(2);
      } else {
        // Random negation flips the sign of whole periods, so the signal repeats at twice the period.
        expect(Math.abs(centsBetween(estimateFrequency(signal, SAMPLE_RATE, hz / 2), hz / 2))).toBeLessThan(2);
      }
    });
  });

  describe("tuning", () => {
    test.each([
      { sampleRate: 44100, hz: 1760, filterType: "average" as const },
      { sampleRate: 48000, hz: 440, filterType: "average" as const },
      { sampleRate: 48000, hz: 1760, filterType: "average" as const },
      { sampleRate: 48000, hz: 2093, filterType: "average" as const },
      { sampleRate: 48000, hz: 440, filterType: "gaussian" as const },
      { sampleRate: 48000, hz: 1760, filterType: "gaussian" as const },
      { sampleRate: 48000, hz: 2093, filterType: "gaussian" as const },
    ])(
      "process should sound within 2 cents of $hz Hz at $sampleRate Hz sample rate using the $filterType filter",
      ({ sampleRate, hz, filterType }) => {
        const signal = render(pluck(filterType, undefined, sampleRate), 0.35, () => hz, sampleRate);

        expect(Math.abs(centsBetween(estimateFrequency(signal, sampleRate, hz), hz))).toBeLessThan(2);
      },
    );
  });

  describe("output", () => {
    test.each(["average", "gaussian", "random-negation"] as const)(
      "process should stay finite and bounded using the %s filter",
      (filterType) => {
        const string = pluck(filterType);
        const signal = render(string, 1, () => 220);

        expect(signal.every((sample) => Number.isFinite(sample) && Math.abs(sample) <= 1.5)).toBe(true);
        expect(signal.some((sample) => sample !== 0)).toBe(true);
      },
    );

    test("process should stay finite and bounded while the frequency bends", () => {
      const string = pluck();
      const signal = render(string, 1, (sample) => 220 * 2 ** (sample / SAMPLE_RATE));

      expect(signal.every((sample) => Number.isFinite(sample) && Math.abs(sample) <= 1.05)).toBe(true);
    });
  });

  describe("bend", () => {
    test("process should stay finite and bounded while the frequency bends by an octave per sample at 44.1 kHz", () => {
      const signal = render(pluck("average", undefined, 44100), 1, (sample) => 440 * 2 ** (sample / 44100), 44100);

      expect(signal.every((sample) => Number.isFinite(sample) && Math.abs(sample) <= 1.05)).toBe(true);
    });
  });

  describe("lifetime", () => {
    test("process should output silence and keep running before the start time", () => {
      const string = new KarplusStrongString(SAMPLE_RATE);
      const output = new Float32Array(BLOCK).fill(0.5);

      string.start(0, 1);
      const keepGoing = string.process(output, 0.5, [220]);

      expect(keepGoing).toBe(true);
      expect(output.every((sample) => sample === 0)).toBe(true);
    });

    test("process should output silence and report the end once the duration has passed", () => {
      const string = pluck("average", 0.5);
      const output = new Float32Array(BLOCK).fill(0.5);

      const keepGoing = string.process(output, 0.5, [220]);

      expect(keepGoing).toBe(false);
      expect(output.every((sample) => sample === 0)).toBe(true);
    });

    test("process should report the end after stop", () => {
      const string = pluck();

      string.stop(0.25);

      expect(string.process(new Float32Array(BLOCK), 0.25, [220])).toBe(false);
    });

    test("process should sound immediately when started without a start time", () => {
      const string = new KarplusStrongString(SAMPLE_RATE, { random: mulberry32(1) });
      string.start(2);
      const output = new Float32Array(BLOCK);

      string.process(output, 2, [220]);

      expect(output.some((sample) => sample !== 0)).toBe(true);
    });
  });
});
