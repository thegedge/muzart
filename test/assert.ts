import nodeAssert from "assert";
import { inspect } from "util";
import { LayoutElement } from "../src/layout";

type Axis = "horizontal" | "vertical";

// A small floating point value to use when comparing approximate equality
const EPSILON = 128 * Number.EPSILON;

const formatLayoutElement = (e: LayoutElement) => {
  return `${e.type}(${e.box.x}, ${e.box.y}, ${e.box.width}, ${e.box.height})`;
};

const contains = <T>(actual: unknown, expected: T): void => {
  if (!Array.isArray(actual) || !actual.includes(expected)) {
    nodeAssert.fail(`${inspect(actual)} does not contain ${inspect(expected)}`);
  }
};

const doesNotContain = <T>(actual: unknown, expected: T): void => {
  if (!Array.isArray(actual)) {
    nodeAssert.fail(`${inspect(actual)} is not an array`);
  }

  if (actual.includes(expected)) {
    nodeAssert.fail(`${inspect(actual)} contains ${inspect(expected)}`);
  }
};

const isAfter = (after: LayoutElement, before: LayoutElement, axis: Axis): void => {
  if (axis == "horizontal") {
    if (after.box.x + EPSILON < before.box.x) {
      nodeAssert.fail(`${formatLayoutElement(after)}'s left edge is not after ${formatLayoutElement(before)}`);
    }
  } else {
    if (after.box.y + EPSILON < before.box.y) {
      nodeAssert.fail(`${formatLayoutElement(after)}'s top edge is not after ${formatLayoutElement(before)}`);
    }
  }
};

const isBefore = (before: LayoutElement, after: LayoutElement, axis: Axis): void => {
  if (axis == "horizontal") {
    if (before.box.x >= after.box.x + EPSILON) {
      nodeAssert.fail(`${formatLayoutElement(before)} is not to the left of ${formatLayoutElement(after)}`);
    }
  } else {
    if (before.box.y >= after.box.y + EPSILON) {
      nodeAssert.fail(`${formatLayoutElement(before)} is not above ${formatLayoutElement(after)}`);
    }
  }
};

const isNonOverlappingAfter = (after: LayoutElement, before: LayoutElement, axis: Axis): void => {
  if (axis == "horizontal") {
    if (after.box.x + EPSILON < before.box.right) {
      nodeAssert.fail(`${formatLayoutElement(after)}'s left edge is not after ${formatLayoutElement(before)}`);
    }
  } else {
    if (after.box.y + EPSILON < before.box.bottom) {
      nodeAssert.fail(`${formatLayoutElement(after)}'s top edge is not after ${formatLayoutElement(before)}`);
    }
  }
};

const isNonOverlappingBefore = (before: LayoutElement, after: LayoutElement, axis: Axis): void => {
  if (axis == "horizontal") {
    if (before.box.right >= after.box.x + EPSILON) {
      nodeAssert.fail(`${formatLayoutElement(before)}'s right edge is not before ${formatLayoutElement(after)}`);
    }
  } else {
    if (before.box.bottom >= after.box.y + EPSILON) {
      nodeAssert.fail(`${formatLayoutElement(before)}'s bottom edge is not before ${formatLayoutElement(after)}`);
    }
  }
};

const equal = <T>(actual: T, expected: T, message?: string | Error) => {
  nodeAssert.deepStrictEqual(actual, expected, message);
};

const identityEqual = <T>(actual: T, expected: T, message?: string | Error) => {
  nodeAssert.equal(actual, expected, message);
};

const atLeast = (actual: number, expected: number, epsilon = EPSILON, message?: string | Error) => {
  if (actual < expected) {
    const diff = Math.abs(actual - expected);
    const norm = Math.min(Math.abs(actual + expected), Number.MAX_VALUE);
    if (diff > Math.max(Number.MIN_VALUE, epsilon * norm)) {
      nodeAssert.fail(message || `${actual} is not at least ${expected}`);
    }
  }
};

const almostEqual = (actual: number, expected: number, epsilon = EPSILON, message?: string | Error) => {
  if (actual != expected) {
    const diff = Math.abs(actual - expected);
    const norm = Math.min(Math.abs(actual + expected), Number.MAX_VALUE);
    if (diff > Math.max(Number.MIN_VALUE, epsilon * norm)) {
      nodeAssert.fail(message || `${actual} is not almost equal to ${expected}`);
    }
  }
};

const assert = {
  almostEqual,
  atLeast,
  contains,
  equal,
  identityEqual,

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

export default assert;
