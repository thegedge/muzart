import {
  Box,
  getAncestorOfType,
  maxMap,
  minMap,
  numCharsToRepresent,
  runs,
  toAncestorCoordinateSystem,
} from "../../src/layout";
import { elem } from "../elementHelpers";
import { assert, describe, test } from "../testing";

describe("utils", () => {
  describe("ancestorOfType", () => {
    test("returns the first ancestor element of the given type", () => {
      const a = elem(0, 0, 1, 1, { type: "A" });
      const b = elem(0, 0, 1, 1, { parent: a, type: "B" });
      const c = elem(0, 0, 1, 1, { parent: b, type: "C" });

      assert.identityEqual(getAncestorOfType(c, "B"), b);
      assert.identityEqual(getAncestorOfType(c, "A"), a);
      assert.identityEqual(getAncestorOfType(b, "A"), a);
    });

    test("returns null when no ancestor of type found", () => {
      const a = elem(0, 0, 1, 1, { type: "A" });
      const b = elem(0, 0, 1, 1, { parent: a, type: "B" });
      const c = elem(0, 0, 1, 1, { parent: b, type: "C" });

      assert.equal(getAncestorOfType(c, "D"), null);
      assert.equal(getAncestorOfType(b, "C"), null);
    });
  });

  describe("toAncestorCoordinateSystem", () => {
    test("converts a descendant's relative box to the root coordinate system", () => {
      const a = elem(1, 2, 1, 1, { type: "A" });
      const b = elem(5, 10, 2, 2, { parent: a, type: "B" });
      const c = elem(10, 20, 3, 3, { parent: b, type: "C" });

      assert.equal(toAncestorCoordinateSystem(b), new Box(6, 12, 2, 2));
      assert.equal(toAncestorCoordinateSystem(c), new Box(16, 32, 3, 3));
    });

    test("converts a descendant's relative box to a given ancestor type's coordinate system", () => {
      const a = elem(1, 2, 1, 1, { type: "A" });
      const b = elem(5, 10, 2, 2, { parent: a, type: "B" });
      const c = elem(10, 20, 3, 3, { parent: b, type: "C" });

      assert.equal(toAncestorCoordinateSystem(c, "A"), new Box(15, 30, 3, 3));
    });

    test("returns the element's box when the given ancestor type is the parent", () => {
      const a = elem(1, 2, 1, 1, { type: "A" });
      const b = elem(5, 10, 2, 2, { parent: a, type: "B" });
      const c = elem(10, 20, 3, 3, { parent: b, type: "C" });

      assert.equal(toAncestorCoordinateSystem(c, "B"), c.box);
      assert.equal(toAncestorCoordinateSystem(b, "A"), b.box);
    });
  });

  describe("minMap", () => {
    test("computes the min value from the given mapper function", () => {
      assert.equal(
        minMap(["abc", "1234", "cx", "longish"], (s) => s.length),
        2,
      );
    });

    test("uses the given lessThan function to compare elements", () => {
      assert.equal(
        minMap(
          ["abc", "1234", "cx", "longish"],
          (s) => s.length,
          (a, b) => b < a,
        ),
        7,
      );
    });
  });

  describe("max", () => {
    test("computes the min value from the given mapper function", () => {
      assert.equal(
        maxMap(["abc", "1234", "cx", "longish"], (s) => s.length),
        7,
      );
    });

    test("uses the given lessThan function to compare elements", () => {
      assert.equal(
        maxMap(
          ["abc", "1234", "cx", "longish"],
          (s) => s.length,
          (a, b) => b < a,
        ),
        2,
      );
    });
  });

  describe("numCharsToRepresent", () => {
    test("computes the correct number of characters to represent the given number", () => {
      assert.equal(numCharsToRepresent(0), 1);
      assert.equal(numCharsToRepresent(1337), 4);
      assert.equal(numCharsToRepresent(-1234567890), 11);
    });
  });

  describe("runs", () => {
    test("computes runs when the mapper always returns a boolean", () => {
      assert.equal(
        runs([0, 1, 2, 4, 3, 5, 7, 1, 4, 14], (v) => v % 2),
        [
          [0, 0, 0],
          [1, 1, 1],
          [2, 3, 0],
          [4, 7, 1],
          [8, 9, 0],
        ],
      );
    });

    test("computes runs when the mapper always returns a number", () => {
      assert.equal(
        runs(["a", "aa", "ab", "aaa", "aab", "abc", "aaaa"], (v) => v.length),
        [
          [0, 0, 1],
          [1, 2, 2],
          [3, 5, 3],
          [6, 6, 4],
        ],
      );
    });

    test("computes runs when the mapper sometimes returns undefined", () => {
      assert.equal(
        runs([0, 1, 2, 4, 3, 5, 7, 1, 4, 14], (v) => (v % 2 == 0 ? true : undefined)),
        [
          [0, 0, true],
          [2, 3, true],
          [8, 9, true],
        ],
      );
    });
  });
});
