import { beforeEach, describe, test } from "vitest";
import { UndoStack } from "../../src/editor/utils/UndoStack";
import { assert } from "../testing";

describe("UndoStack", () => {
  let stack: UndoStack<number>;

  beforeEach(() => {
    stack = new UndoStack();
  });

  describe("length", () => {
    test("is 0 when empty", () => {
      assert.equal(stack.length, 0);
    });

    test("is 2 after pushing two items", () => {
      stack.push(1);
      stack.push(2);

      assert.equal(stack.length, 2);
    });

    test("is 2 after pushing some items and undoing", () => {
      stack.push(1);
      stack.push(2);
      stack.undo();
      stack.undo();

      assert.equal(stack.length, 2);
    });
  });

  describe("push", () => {
    test("has expected items after only pushing some items", () => {
      stack.push(1);
      stack.push(2);

      assert.equal(stack.toJSON(), [1, 2]);
    });

    test("has expected items after a combination of pushing, undoing, and redoing", () => {
      stack.push(1);
      stack.push(2);
      stack.undo();
      stack.push(3);
      stack.undo();
      stack.undo();
      stack.redo();
      stack.push(4);

      assert.equal(stack.toJSON(), [1, 4]);
    });
  });

  describe("toJSON", () => {
    test("is empty array before pushing anything", () => {
      assert.equal(stack.toJSON(), []);
    });

    test("is expected array after pushing some items", () => {
      stack.push(1);
      stack.push(2);

      assert.equal(stack.toJSON(), [1, 2]);
    });

    test("is expected array after many ops ending in a push", () => {
      stack.push(1);
      stack.push(2);
      stack.undo();
      stack.push(3);
      stack.undo();
      stack.undo();
      stack.redo();
      stack.push(4);

      assert.equal(stack.toJSON(), [1, 4]);
    });

    test("is expected array after many ops ending in a redo", () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      stack.undo();
      stack.undo();
      stack.redo();

      assert.equal(stack.toJSON(), [1, 2]);
    });

    test("is expected array after many ops ending in an undo", () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      stack.undo();
      stack.undo();

      assert.equal(stack.toJSON(), [1]);
    });
  });

  describe("head", () => {
    test("is undefined before pushing anything", () => {
      assert.equal(stack.head, undefined);
    });

    test("is expected array after pushing some items", () => {
      stack.push(1);
      stack.push(2);

      assert.equal(stack.head, 2);
    });

    test("is expected array after many ops ending in a push", () => {
      stack.push(1);
      stack.push(2);
      stack.undo();
      stack.push(3);
      stack.undo();
      stack.undo();
      stack.redo();
      stack.push(4);

      assert.equal(stack.head, 4);
    });

    test("is expected array after many ops ending in a redo", () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      stack.undo();
      stack.undo();
      stack.redo();

      assert.equal(stack.head, 2);
    });

    test("is expected array after many ops ending in an undo", () => {
      stack.push(1);
      stack.push(2);
      stack.push(3);
      stack.undo();
      stack.undo();

      assert.equal(stack.head, 1);
    });
  });

  describe("clear", () => {
    test("resets the undo stack", () => {
      stack.push(1);
      stack.push(2);
      stack.undo();
      stack.clear();

      assert.equal(stack.undo(), undefined);
      assert.equal(stack.redo(), undefined);
      assert.equal(stack.length, 0);
    });
  });

  describe("undo", () => {
    test("does nothing when the stack is empty", () => {
      assert.equal(stack.undo(), undefined);
      assert.equal(stack.undo(), undefined);
    });

    test("can undo actions", () => {
      stack.push(1);
      stack.push(2);

      assert.equal(stack.length, 2);
      assert.equal(stack.undo(), 2);
      assert.equal(stack.undo(), 1);
      assert.equal(stack.undo(), undefined);
    });
  });

  describe("redo", () => {
    test("does nothing when the stack is empty", () => {
      assert.equal(stack.redo(), undefined);
      assert.equal(stack.redo(), undefined);
    });

    test("can redo actions", () => {
      stack.push(1);
      stack.push(2);
      assert.equal(stack.redo(), undefined);

      stack.undo();
      stack.undo();

      assert.equal(stack.redo(), 1);
      assert.equal(stack.redo(), 2);
      assert.equal(stack.redo(), undefined);
      assert.equal(stack.length, 2);
    });
  });
});
