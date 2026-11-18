import { describe, expect, test } from "vitest";
import { NoiseGenerator } from "../src/NoiseGenerator";

const BLOCK = 128;

describe("NoiseGenerator", () => {
  test("process should output silence and keep running when started in the future", () => {
    const noise = new NoiseGenerator();
    const output = new Float32Array(BLOCK).fill(0.5);

    noise.start(0, 1.0);
    const keepGoing = noise.process(output, 0.5);

    expect(keepGoing).toBe(true);
    expect(output.every((sample) => sample === 0)).toBe(true);
  });

  test("process should output bounded non-constant noise once started", () => {
    const noise = new NoiseGenerator();
    const output = new Float32Array(BLOCK);

    noise.start(0, 0);
    const keepGoing = noise.process(output, 0);

    expect(keepGoing).toBe(true);
    expect(output.every((sample) => sample >= -1 && sample <= 1)).toBe(true);
    expect(new Set(output).size).toBeGreaterThan(BLOCK / 2);
  });

  test("process should output silence and report the end after the duration has passed", () => {
    const noise = new NoiseGenerator();
    const output = new Float32Array(BLOCK).fill(0.5);

    noise.start(0, 0, 0.5);
    const keepGoing = noise.process(output, 0.5);

    expect(keepGoing).toBe(false);
    expect(output.every((sample) => sample === 0)).toBe(true);
  });

  test("process should report the end after stop", () => {
    const noise = new NoiseGenerator();
    noise.start(0);
    noise.stop(2);

    expect(noise.process(new Float32Array(BLOCK), 2)).toBe(false);
  });

  test("process should start immediately when no start time is given", () => {
    const noise = new NoiseGenerator();
    const output = new Float32Array(BLOCK);

    noise.start(3);
    noise.process(output, 3);

    expect(output.some((sample) => sample !== 0)).toBe(true);
  });
});
