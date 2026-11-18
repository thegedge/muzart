import { describe, expect, test } from "vitest";
import { KarplusStrongString, type FilterType } from "../src/KarplusStrongString";

const SAMPLE_RATE = 48000;
const BLOCK = 128;

/** Deterministic PRNG */
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pluck = (filterType: FilterType = "average", durationSecs?: number) => {
  const string = new KarplusStrongString(SAMPLE_RATE, { filterType }, mulberry32(1));
  string.start(0, 0, durationSecs);
  return string;
};

/** Renders `seconds` of audio, a block at a time, asking for `frequencyAt(sampleIndex)` for every sample. */
const render = (string: KarplusStrongString, seconds: number, frequencyAt: (sample: number) => number) => {
  const total = Math.ceil((seconds * SAMPLE_RATE) / BLOCK) * BLOCK;
  const result = new Float32Array(total);
  for (let start = 0; start < total; start += BLOCK) {
    const block = new Float32Array(BLOCK);
    const frequencies = block.map((_, i) => frequencyAt(start + i));
    string.process(block, start / SAMPLE_RATE, frequencies);
    result.set(block, start);
  }
  return result;
};

/** Correlate a signal with a lagged version of itself */
const autocorrelation = (signal: Float32Array, lag: number) => {
  let sum = 0;
  for (let n = 0; n + lag < signal.length; ++n) {
    sum += signal[n] * signal[n + lag];
  }
  return sum / (signal.length - lag);
};

/**
 * Estimates the fundamental frequency of a periodic signal.
 *
 * Uses a method known as "Quadratic Interpolation of Spectral Peaks"
 *
 * @see https://ccrma.stanford.edu/~jos/sasp/Quadratic_Interpolation_Spectral_Peaks.html
 */
const estimateFrequency = (signal: Float32Array, expectedHz: number) => {
  const expectedLag = SAMPLE_RATE / expectedHz;
  let bestLag = Math.floor(expectedLag * 0.95);
  for (let lag = bestLag; lag <= Math.ceil(expectedLag * 1.05); ++lag) {
    if (autocorrelation(signal, lag) > autocorrelation(signal, bestLag)) {
      bestLag = lag;
    }
  }

  const [before, peak, after] = [
    autocorrelation(signal, bestLag - 1),
    autocorrelation(signal, bestLag),
    autocorrelation(signal, bestLag + 1),
  ];
  const refinement = (0.5 * (before - after)) / (before - 2 * peak + after);
  return SAMPLE_RATE / (bestLag + refinement);
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
        expect(Math.abs(centsBetween(estimateFrequency(signal, hz), hz))).toBeLessThan(20);
      } else {
        // Random negation flips the sign of whole periods, so the signal repeats at twice the period.
        expect(Math.abs(centsBetween(estimateFrequency(signal, hz / 2), hz / 2))).toBeLessThan(20);
      }
    });
  });

  describe("output", () => {
    test.each(["average", "gaussian", "random-negation"] as const)(
      "process should stay finite and within [-1, 1] using the %s filter",
      (filterType) => {
        const string = pluck(filterType);
        const signal = render(string, 1, () => 220);

        expect(signal.every((sample) => Number.isFinite(sample) && Math.abs(sample) <= 1)).toBe(true);
        expect(signal.some((sample) => sample !== 0)).toBe(true);
      },
    );

    test("process should stay finite and bounded while the frequency bends", () => {
      const string = pluck();
      const signal = render(string, 1, (sample) => 220 * 2 ** (sample / SAMPLE_RATE));

      expect(signal.every((sample) => Number.isFinite(sample) && Math.abs(sample) <= 1)).toBe(true);
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
      const string = new KarplusStrongString(SAMPLE_RATE, {}, mulberry32(1));
      string.start(2);
      const output = new Float32Array(BLOCK);

      string.process(output, 2, [220]);

      expect(output.some((sample) => sample !== 0)).toBe(true);
    });
  });
});
