import { isMatch } from "lodash";
import { inspect } from "util";
import * as vitest from "vitest";

type Axis = "horizontal" | "vertical";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

type LayoutElement = {
  type: string;
  box: Box;
};

// A small floating point value to use when comparing approximate equality
const EPSILON = 128 * Number.EPSILON;

const formatLayoutElement = (e: LayoutElement) => {
  return `${e.type}(${e.box.x}, ${e.box.y}, ${e.box.width}, ${e.box.height})`;
};

const contains = <T>(actual: unknown, expected: T): void => {
  if (!Array.isArray(actual) || !actual.includes(expected)) {
    vitest.expect.fail(`${inspect(actual)} does not contain ${inspect(expected)}`);
  }
};

const doesNotContain = <T>(actual: unknown, expected: T): void => {
  if (!Array.isArray(actual)) {
    vitest.expect.fail(`${inspect(actual)} is not an array`);
  }

  if (actual.includes(expected)) {
    vitest.expect.fail(`${inspect(actual)} contains ${inspect(expected)}`);
  }
};

const isAfter = (after: LayoutElement, before: LayoutElement, axis: Axis): void => {
  if (axis == "horizontal") {
    if (after.box.x + EPSILON < before.box.x) {
      vitest.expect.fail(`${formatLayoutElement(after)}'s left edge is not after ${formatLayoutElement(before)}`);
    }
  } else {
    if (after.box.y + EPSILON < before.box.y) {
      vitest.expect.fail(`${formatLayoutElement(after)}'s top edge is not after ${formatLayoutElement(before)}`);
    }
  }
};

const isBefore = (before: LayoutElement, after: LayoutElement, axis: Axis): void => {
  if (axis == "horizontal") {
    if (before.box.x >= after.box.x + EPSILON) {
      vitest.expect.fail(`${formatLayoutElement(before)} is not to the left of ${formatLayoutElement(after)}`);
    }
  } else {
    if (before.box.y >= after.box.y + EPSILON) {
      vitest.expect.fail(`${formatLayoutElement(before)} is not above ${formatLayoutElement(after)}`);
    }
  }
};

const isNonOverlappingAfter = (after: LayoutElement, before: LayoutElement, axis: Axis): void => {
  if (axis == "horizontal") {
    if (after.box.x + EPSILON < before.box.right) {
      vitest.expect.fail(`${formatLayoutElement(after)}'s left edge is not after ${formatLayoutElement(before)}`);
    }
  } else {
    if (after.box.y + EPSILON < before.box.bottom) {
      vitest.expect.fail(`${formatLayoutElement(after)}'s top edge is not after ${formatLayoutElement(before)}`);
    }
  }
};

const isNonOverlappingBefore = (before: LayoutElement, after: LayoutElement, axis: Axis): void => {
  if (axis == "horizontal") {
    if (before.box.right >= after.box.x + EPSILON) {
      vitest.expect.fail(`${formatLayoutElement(before)}'s right edge is not before ${formatLayoutElement(after)}`);
    }
  } else {
    if (before.box.bottom >= after.box.y + EPSILON) {
      vitest.expect.fail(`${formatLayoutElement(before)}'s bottom edge is not before ${formatLayoutElement(after)}`);
    }
  }
};

const equal = <T>(actual: T, expected: T, message?: string) => {
  vitest.expect(actual, message).toEqual(expected);
};

const identityEqual = <T>(actual: T, expected: T, message?: string) => {
  vitest.expect(actual, message).toBe(expected);
};

const matches = <T1 extends object, T2 extends object>(actual: T1, expected: T2, message?: string) => {
  if (!isMatch(actual, expected)) {
    const actualString = JSON.stringify(actual);
    const expectedString = JSON.stringify(expected);
    vitest.expect.fail(message || `${actualString} does not match ${expectedString}`);
  }
};

const atLeast = (actual: number, expected: number, epsilon = EPSILON, message?: string) => {
  if (actual < expected) {
    const diff = Math.abs(actual - expected);
    const norm = Math.min(Math.abs(actual + expected), Number.MAX_VALUE);
    if (diff > Math.max(Number.MIN_VALUE, epsilon * norm)) {
      vitest.expect.fail(message || `${actual} is not at least ${expected}`);
    }
  }
};

const almostEqual = (actual: number, expected: number, epsilon = EPSILON, message?: string) => {
  if (actual != expected) {
    const diff = Math.abs(actual - expected);
    const norm = Math.min(Math.abs(actual + expected), Number.MAX_VALUE);
    if (diff > Math.max(Number.MIN_VALUE, epsilon * norm)) {
      vitest.expect.fail(message || `${actual} is not almost equal to ${expected}`);
    }
  }
};

export { afterAll, afterEach, beforeAll, beforeEach, describe, test } from "vitest";

export const mock = vitest.vi;

export const assert = {
  almostEqual,
  atLeast,
  contains,
  equal,
  identityEqual,
  matches,

  // Geometrical assertions

  isAfter,
  isBefore,

  nonOverlapping: {
    isAfter: isNonOverlappingAfter,
    isBefore: isNonOverlappingBefore,
  },

  not: {
    contains: doesNotContain,
  },
};
