import { describe, test } from "vitest";
import { digits } from "../../src/utils/digits";
import { assert } from "../testing";

describe("digits", () => {
  test("returns the expected digits array for a single digit number", () => {
    assert.equal(digits(1), [1]);
  });

  test("returns the expected digits array for a multi digit number", () => {
    assert.equal(digits(12921), [1, 2, 9, 2, 1]);
  });

  test("returns the expected digits array for a negative, single digit number", () => {
    assert.equal(digits(-3), [3]);
  });

  test("returns the expected digits array for a negative, multi digit number", () => {
    assert.equal(digits(-3123), [3, 1, 2, 3]);
  });
});
