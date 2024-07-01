import { assert, describe, test } from "@muzart/testing";
import { maxBy } from "lodash";
import { type FlexGroupConfig, FlexGroupElement } from "../../src/layouts/FlexGroup";
import { elem, end, size, start } from "../elementHelpers";
import { Box } from "../../src/utils/Box";

interface TestScenario {
  /** Options for the flex group element */
  options: Partial<FlexGroupConfig>;

  /** [[x, y, width, height], stretch factor] */
  children: [[number, number, number, number], number | undefined][];

  /**
   * Array of arrays, where the inner array is the indexes of the children (from the above) and the outer
   * array represents each line in the result
   */
  lines: number[][];
}

describe("FlexGroup", () => {
  describe("layout", () => {
    // TODO maybe find a way to randomize these a bit
    const scenarios: TestScenario[] = [
      {
        options: {
          box: new Box(521, 0, 26241, 1),
          gap: 50,
        },
        children: [
          [[1, 1, 10, 1], 3],
          [[1, 1, 20, 1], 4],
          [[1, 1, 30, 1], undefined],
          [[1, 1, 40, 1], 2],
        ],
        lines: [[0, 1, 2, 3]],
      },
      {
        options: {
          box: new Box(0, 23, 50, 2489),
          gap: 22,
          axis: "vertical",
        },
        children: [
          [[1, 1, 1, 10], 3],
          [[1, 1, 1, 20], 4],
          [[1, 1, 1, 30], undefined],
          [[1, 1, 1, 40], 2],
        ],
        lines: [[0, 1, 2, 3]],
      },
      {
        options: {
          box: new Box(73, 23, 50, 2000),
          gap: 10,
          wrap: true,
        },
        children: [
          [[1, 1, 10, 1], 1],
          [[1, 1, 20, 1], 2],
          [[1, 1, 30, 1], 1],
          [[1, 1, 10, 1], 2],
        ],
        lines: [
          [0, 1],
          [2, 3],
        ],
      },
      {
        options: {
          box: new Box(50, 12, 1500, 50),
          wrap: true,
          axis: "vertical",
        },
        children: [
          [[1, 1, 1, 12], 1],
          [[1, 1, 1, 33], 2],
          [[1, 1, 1, 41], 1],
          [[1, 1, 1, 15], 2],
        ],
        lines: [[0, 1], [2], [3]],
      },
      {
        options: {
          box: new Box(1, 2, 250, 2000),
          gap: 10,
          defaultStretchFactor: 0,
        },
        children: [
          [[1, 1, 10, 1], undefined],
          [[1, 1, 20, 1], undefined],
          [[1, 1, 30, 1], undefined],
          [[1, 1, 10, 1], undefined],
        ],
        lines: [[0, 1, 2, 3]],
      },
    ];

    const scenarioName = (scenario: TestScenario) => {
      const pieces = [];
      if (scenario.options.gap) {
        pieces.push("with gap");
      }

      if (scenario.options.defaultStretchFactor == 0) {
        pieces.push("without space distribution");
      }

      if (scenario.options.wrap === true) {
        pieces.push("with wrapping");
      }

      if (scenario.options.axis == "vertical") {
        pieces.push("vertical");
      } else {
        pieces.push("horizontal");
      }

      return pieces.join(", ");
    };

    scenarios.forEach((scenario) => {
      const gap = scenario.options.gap ?? 0;
      const defaultFactor = scenario.options.defaultStretchFactor ?? 1;
      const axis = scenario.options.axis ?? "horizontal";
      const wrapping = scenario.options.wrap ?? false;
      const crossAxis = axis == "horizontal" ? "vertical" : "horizontal";
      const hasStretchyChild = scenario.children.some((child) => child[1] ?? defaultFactor != 0);

      describe(scenarioName(scenario), () => {
        const group = new FlexGroupElement(scenario.options);
        const children = scenario.children.map(([args, factor]) => {
          const child = elem(...args);
          group.addElement(child, factor);
          return child;
        });

        group.layout();

        test("doesn't have overlap between adjacent children", () => {
          for (const line of scenario.lines) {
            for (let index = 1; index < line.length; ++index) {
              const child1 = children[line[index - 1]];
              const child2 = children[line[index]];
              assert.nonOverlapping.isBefore(child1, child2, axis);
            }
          }
        });

        if (gap > 0) {
          test("puts a gap between adjacent children", () => {
            for (const line of scenario.lines) {
              for (let index = 1; index < line.length; ++index) {
                const child1 = children[line[index - 1]];
                const child2 = children[line[index]];
                assert.almostEqual(start(child2, axis) - end(child1, axis), gap);
              }
            }
          });
        }

        if (hasStretchyChild) {
          test("has last child on each line at the ending edge", () => {
            for (const line of scenario.lines) {
              const lineHasStretchyChild = line.some((ci) => scenario.children[ci][1] ?? defaultFactor != 0);

              // Last child's right edge should align with the box's width if any child on the line will grow
              if (lineHasStretchyChild) {
                const lastChild = children[line[line.length - 1]];
                assert.almostEqual(end(lastChild, axis), size(group, axis));
              }
            }
          });

          test("distributes extra space according to each child's stretch factor", () => {
            for (const line of scenario.lines) {
              const lineHasStretchyChild = line.some((ci) => scenario.children[ci][1] ?? defaultFactor != 0);

              for (let index = 1; index < line.length; ++index) {
                const child1 = children[line[index - 1]];
                const child2 = children[line[index]];

                if (lineHasStretchyChild) {
                  const [box1, factor1] = scenario.children[line[index - 1]];
                  const [box2, factor2] = scenario.children[line[index]];
                  if ((factor2 ?? defaultFactor) != 0) {
                    const extra1 = size(child1, axis) - box1[axis == "horizontal" ? 2 : 3];
                    const extra2 = size(child2, axis) - box2[axis == "horizontal" ? 2 : 3];
                    assert.almostEqual(extra1 / extra2, (factor1 ?? defaultFactor) / (factor2 ?? defaultFactor));
                  }
                }
              }
            }
          });
        }

        if (wrapping) {
          test("doesn't overlap adjacent lines", () => {
            for (let lineIndex = 1; lineIndex < scenario.lines.length; ++lineIndex) {
              const lowestChildIndex = maxBy(scenario.lines[lineIndex - 1], (index) => end(children[index], crossAxis));
              const lowestChildPreviousLine = children[lowestChildIndex ?? 0];
              for (const childIndex of scenario.lines[lineIndex]) {
                assert.nonOverlapping.isAfter(children[childIndex], lowestChildPreviousLine, crossAxis);
              }
            }
          });
        }
      });

      // TODO cross axis alignment
      // TODO main axis distribution when no stretch factor
    });
  });

  describe("tryAddElement", () => {
    test("adds the child to its children list", () => {
      const group = new FlexGroupElement();
      const child = elem(5, 8, 30, 5);
      const currentChildCount = group.children.length;

      const result = group.tryAddElement(child);

      assert.equal(result, true);
      assert.equal(group.children.length, currentChildCount + 1);
      assert.contains(group.children, child);
    });

    test("sets the left edge of each child to right edge of the previous child", () => {
      const group = new FlexGroupElement({ box: new Box(0, 0, 1000, 1) });
      const child1 = elem(1, 1, 30, 1);
      const child2 = elem(1, 1, 12, 1);
      const child3 = elem(1, 1, 47, 1);
      const currentChildCount = group.children.length;

      group.tryAddElement(child1);
      group.tryAddElement(child2);
      group.tryAddElement(child3);

      assert.equal(group.children.length, currentChildCount + 3);
      assert.contains(group.children, child1);
      assert.contains(group.children, child2);
      assert.contains(group.children, child3);
      assert.equal(child1.box.x, 0);
      assert.equal(child2.box.x, child1.box.right);
      assert.equal(child3.box.x, child2.box.right);
    });

    test("return true and adds element if it's the first and there's no room for it", () => {
      const group = new FlexGroupElement({ box: new Box(0, 0, 10, 1) });
      const child = elem(1, 1, 30, 1);

      const result = group.tryAddElement(child);

      assert.equal(result, true);
      assert.equal(group.children.length, 1);
      assert.contains(group.children, child);
    });

    test("return false and doesn't add element if there's no room for it", () => {
      const group = new FlexGroupElement({ box: new Box(0, 0, 50, 1) });
      const child1 = elem(1, 1, 30, 1);
      const child2 = elem(1, 1, 12, 1);
      const child3 = elem(1, 1, 47, 1);
      group.tryAddElement(child1);
      group.tryAddElement(child2);
      const currentChildCount = group.children.length;

      const result = group.tryAddElement(child3);

      assert.equal(result, false);
      assert.equal(group.children.length, currentChildCount);
      assert.contains(group.children, child1);
      assert.contains(group.children, child2);
      assert.not.contains(group.children, child3);
    });

    test("sets the parent of children elements to itself", () => {
      const group = new FlexGroupElement();
      const child = elem(5, 8, 30, 5);

      group.tryAddElement(child);

      assert.equal(child.parent, group);
    });
  });

  describe("addElement", () => {
    test("adds the child to its children list", () => {
      const group = new FlexGroupElement();
      const child = elem(5, 8, 30, 5);
      const currentChildCount = group.children.length;

      group.addElement(child);

      assert.equal(group.children.length, currentChildCount + 1);
      assert.contains(group.children, child);
    });

    test("sets the left edge of each child to right edge of the previous child", () => {
      const group = new FlexGroupElement({ box: new Box(0, 0, 50, 1) });
      const child1 = elem(1, 1, 30, 1);
      const child2 = elem(1, 1, 12, 1);
      const child3 = elem(1, 1, 47, 1);
      const currentChildCount = group.children.length;

      group.addElement(child1);
      group.addElement(child2);
      group.addElement(child3);

      assert.equal(group.children.length, currentChildCount + 3);
      assert.contains(group.children, child1);
      assert.contains(group.children, child2);
      assert.contains(group.children, child3);
      assert.equal(child1.box.x, 0);
      assert.equal(child2.box.x, child1.box.right);
      assert.equal(child3.box.x, child2.box.right);
    });

    test("sets the parent of children elements to itself", () => {
      const group = new FlexGroupElement();
      const child = elem(5, 8, 30, 5);

      group.addElement(child);

      assert.equal(child.parent, group);
    });
  });
});
