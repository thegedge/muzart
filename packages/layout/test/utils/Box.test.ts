import { assert, describe, test } from "@muzart/testing";
import { Box } from "../../src/utils/Box";

describe("Box", () => {
  describe(".empty", () => {
    test("creates an empty box", () => {
      assert.equal(Box.empty(), new Box(0, 0, 0, 0));
    });
  });

  describe(".encompass", () => {
    test("returns an empty box when none given", () => {
      assert.equal(Box.encompass(), Box.empty());
    });

    test("encompasses the given boxes", () => {
      assert.equal(
        Box.encompass(new Box(0, 0, 10, 10), new Box(-5, 5, 22, 3), new Box(-100, -2, 5, 33)),
        new Box(-100, -2, 117, 33),
      );
    });
  });

  describe("clone", () => {
    test("returns an equivalent box", () => {
      assert.equal(new Box(1, 2, 3, 4).clone(), new Box(1, 2, 3, 4));
    });
  });

  describe("translate", () => {
    test("returns a box with x and y adjusted by given argument", () => {
      assert.equal(new Box(1, 1, 2, 2).translate(4), new Box(5, 5, 2, 2));
    });

    test("returns a box with x and y separately adjusted by given arguments", () => {
      assert.equal(new Box(1, 1, 2, 2).translate(4, -6), new Box(5, -5, 2, 2));
    });
  });

  describe("expand", () => {
    test("returns a box expanded in both directions by given argument", () => {
      assert.equal(new Box(1, 1, 2, 2).expand(4), new Box(-3, -3, 10, 10));
    });

    test("returns a box expanded in both directions separately by given arguments", () => {
      assert.equal(new Box(1, 1, 2, 2).expand(2, 4), new Box(-1, -3, 6, 10));
    });

    test("returns a box that has grown and shrunk based on given arguments", () => {
      assert.equal(new Box(0, 0, 10, 10).expand(2, -4), new Box(-2, 4, 14, 2));
    });
  });

  describe("update", () => {
    test("returns a new box with updated location", () => {
      assert.equal(new Box(1, 1, 2, 2).update({ x: 5, y: 10 }), new Box(5, 10, 2, 2));
    });

    test("returns a new box with updated dimensions", () => {
      assert.equal(new Box(1, 1, 2, 2).update({ width: 5, height: 10 }), new Box(1, 1, 5, 10));
    });

    test("returns the same box when given an empty argument", () => {
      assert.equal(new Box(1, 1, 2, 2).update({}), new Box(1, 1, 2, 2));
    });

    test("returns a box with expected changes when mixed updates", () => {
      assert.equal(new Box(1, 1, 2, 2).update({ x: 3, height: 123 }), new Box(3, 1, 2, 123));
    });
  });

  describe("encompass", () => {
    test("creates a box that encompasses current and given box when there's non-overlapping area", () => {
      assert.equal(new Box(0, 0, 10, 10).encompass(new Box(-5, 5, 22, 3)), new Box(-5, 0, 22, 10));
    });

    test("returns the same box when it contains the given box", () => {
      assert.equal(new Box(0, 10, 100, 200).encompass(new Box(5, 50, 11, 22)), new Box(0, 10, 100, 200));
    });
  });

  describe("contains", () => {
    describe("returns true", () => {
      test("when given a point inside the box", () => {
        assert.equal(new Box(0, 0, 10, 10).contains({ x: 1, y: 1 }), true);
      });

      test("when given a point on an edge", () => {
        const box = new Box(0, 0, 10, 10);
        assert.equal(box.contains({ x: 0, y: 2 }), true);
        assert.equal(box.contains({ x: 10, y: 3 }), true);
        assert.equal(box.contains({ x: 2, y: 0 }), true);
        assert.equal(box.contains({ x: 3, y: 10 }), true);
      });

      test("when given a box that is fully contained", () => {
        assert.equal(new Box(0, 0, 10, 10).contains(new Box(1, 1, 2, 2)), true);
      });

      test("when given a box that overlaps an edge", () => {
        const box = new Box(0, 0, 10, 10);
        assert.equal(box.contains(new Box(1, 1, 9, 1)), true);
        assert.equal(box.contains(new Box(0, 1, 1, 1)), true);
        assert.equal(box.contains(new Box(1, 1, 1, 9)), true);
        assert.equal(box.contains(new Box(1, 0, 1, 1)), true);
      });
    });

    describe("returns false", () => {
      test("when given a point outside the box", () => {
        assert.equal(new Box(0, 0, 10, 10).contains({ x: 11, y: 1 }), false);
      });

      test("when given a box that is non-overlapping", () => {
        assert.equal(new Box(0, 0, 10, 10).contains(new Box(100, 0, 1, 1)), false);
      });

      test("when given a box that is partially contained", () => {
        assert.equal(new Box(0, 0, 10, 10).contains(new Box(1, 1, 20, 20)), false);
      });
    });
  });

  describe("overlaps", () => {
    describe("returns true", () => {
      test("when given a box that is fully contained", () => {
        assert.equal(new Box(0, 0, 10, 10).overlaps(new Box(1, 1, 2, 2)), true);
      });

      test("when given a box that is partially contained", () => {
        assert.equal(new Box(0, 0, 10, 10).overlaps(new Box(1, 1, 20, 20)), true);
      });

      test("when given a box that overlaps an edge", () => {
        const box = new Box(0, 0, 10, 10);
        assert.equal(box.overlaps(new Box(1, 1, 9, 1)), true);
        assert.equal(box.overlaps(new Box(0, 1, 1, 1)), true);
        assert.equal(box.overlaps(new Box(1, 1, 1, 9)), true);
        assert.equal(box.overlaps(new Box(1, 0, 1, 1)), true);
      });
    });

    describe("returns false", () => {
      test("when given a box that is non-overlapping", () => {
        assert.equal(new Box(0, 0, 10, 10).overlaps(new Box(100, 0, 1, 1)), false);
      });
    });
  });
});
