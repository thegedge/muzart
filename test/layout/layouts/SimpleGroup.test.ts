import { describe, it, mock } from "node:test";
import { Box } from "../../../src/layout";
import { SimpleGroupElement } from "../../../src/layout/layouts/SimpleGroup";
import assert from "../../assert";
import { LayoutFn, elem } from "../../elementHelpers";

describe("SimpleGroup", () => {
  describe("layout", () => {
    it("sets its own box to a box encompassing all of its children", () => {
      const group = new SimpleGroupElement();
      group.addElement(elem(-5, 0, 10, 10));
      group.addElement(elem(20, 20, 1, 1));

      group.layout();
      assert.equal(group.box, new Box(0, 0, 26, 21));

      group.addElement(elem(5, 8, 30, 5));
      group.layout();
      assert.equal(group.box, new Box(0, 0, 40, 21));
    });

    it("lays out all of its children", () => {
      const group = new SimpleGroupElement();
      const layoutMock = mock.fn<LayoutFn>();
      group.addElement(elem(0, 0, 1, 1, layoutMock));
      group.addElement(elem(0, 0, 2, 4, layoutMock));
      group.addElement(elem(0, 0, 3, 9, layoutMock));
      assert.equal(layoutMock.mock.callCount(), 0);

      group.layout();

      assert.equal(layoutMock.mock.callCount(), 3);
    });
  });

  describe("addElement", () => {
    it("adds the child to its children list", () => {
      const group = new SimpleGroupElement();
      const child = elem(5, 8, 30, 5);
      const currentChildCount = group.children.length;

      group.addElement(child);

      assert.equal(group.children.length, currentChildCount + 1);
      assert.contains(group.children, child);
    });

    it("sets the parent of children elements to itself", () => {
      const group = new SimpleGroupElement();
      const child = elem(5, 8, 30, 5);

      group.addElement(child);

      assert.equal(child.parent, group);
    });
  });
});