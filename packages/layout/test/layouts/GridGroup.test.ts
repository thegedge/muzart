import { assert, describe, test } from "@muzart/testing";
import { maxBy } from "lodash";
import { type Constraint, GridGroup, type Options } from "../../src/layouts/GridGroup";
import { elem, end } from "../elementHelpers";
import { Box } from "../../src/utils/Box";

interface TestScenario {
  /** Display name for this scenario. */
  name: string;

  /** Options used to construct the grid group */
  options?: Options;

  /** [[x, y, width, height], stretch factor] */
  children: [[number, number, number, number], Constraint][];

  /** The right edges on the grid group */
  edges: number[];

  /**
   * Array of arrays, where the inner array is the indexes of the children (from the above) and the outer
   * array represents each line in the result
   */
  lines: number[][];
}

describe("GridGroup", () => {
  describe("layout", () => {
    const scenarios: TestScenario[] = [
      {
        name: "places children on a line when there's no overlap",
        options: {
          box: new Box(0, 0, 1000, 100),
        },
        children: [
          [[0, 0, 5, 5], { startColumn: 0, endColumn: 2 }],
          [[0, 0, 5, 5], { startColumn: 3, endColumn: 3 }],
          [[0, 0, 5, 5], { startColumn: 4, endColumn: 5 }],
        ],
        edges: [10, 20, 30, 40, 50],
        lines: [[0, 1, 2]],
      },
      {
        name: "places children on separate lines when there's overlap",
        options: {
          box: new Box(0, 0, 1000, 100),
        },
        children: [
          [[0, 0, 5, 5], { startColumn: 0, endColumn: 3 }],
          [[0, 0, 5, 5], { startColumn: 2, endColumn: 3 }],
          [[0, 0, 5, 5], { startColumn: 4, endColumn: 5 }],
        ],
        edges: [10, 20, 30, 40, 50],
        lines: [[1], [0, 2]],
      },
      {
        name: "places children with gap",
        options: {
          gap: 5,
          box: new Box(0, 0, 1000, 100),
        },
        children: [
          [[0, 0, 5, 5], { startColumn: 0, endColumn: 3 }],
          [[0, 0, 5, 5], { startColumn: 2, endColumn: 3 }],
          [[0, 0, 5, 5], { startColumn: 4, endColumn: 5 }],
          [[0, 0, 5, 5], { startColumn: 0, endColumn: 1 }],
        ],
        edges: [10, 20, 30, 40, 50],
        lines: [
          [3, 1],
          [0, 2],
        ],
      },
      {
        name: "prefers placing children of the same group on the same line",
        options: {
          box: new Box(0, 0, 1000, 100),
        },
        children: [
          [[0, 0, 5, 5], { startColumn: 0, endColumn: 3, group: "a" }],
          [[0, 0, 5, 5], { startColumn: 4, endColumn: 5, group: "b" }],
          [[0, 0, 5, 5], { startColumn: 4, endColumn: 5, group: "a" }],
        ],
        edges: [10, 20, 30, 40, 50],
        lines: [[1], [0, 2]],
      },
      {
        name: "ensures children with mustBeBottomRow end up on the bottom row",
        options: {
          box: new Box(0, 0, 1000, 100),
        },
        children: [
          [[0, 0, 5, 5], { startColumn: 0, endColumn: 3 }],
          [[0, 0, 5, 5], { startColumn: 4, endColumn: 5, mustBeBottomRow: true }],
          [[0, 0, 5, 5], { startColumn: 4, endColumn: 5 }],
        ],
        edges: [10, 20, 30, 40, 50],
        lines: [[0, 2], [1]],
      },
    ];

    const scenarioName = (scenario: TestScenario) => {
      return scenario.name;
    };

    scenarios.forEach((scenario) => {
      const gap = scenario.options?.gap ?? 0;
      const axis = "horizontal";
      const crossAxis = "vertical";

      describe(scenarioName(scenario), () => {
        const group = new GridGroup(scenario.options);
        const children = scenario.children.map(([args, constraint]) => {
          const child = elem(...args);
          group.addElement(child, constraint);
          return child;
        });

        group.setRightEdges(scenario.edges);
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

        if (gap > 0 && scenario.lines.length > 1) {
          test("puts a gap between adjacent lines", () => {
            for (let lineIndex = 1; lineIndex < scenario.lines.length; ++lineIndex) {
              const lowestChildIndex = maxBy(scenario.lines[lineIndex - 1], (index) => end(children[index], crossAxis));
              const lowestChildPreviousLine = children[lowestChildIndex ?? 0];
              for (const childIndex of scenario.lines[lineIndex]) {
                assert.atLeast(children[childIndex].box.y - lowestChildPreviousLine.box.bottom, gap);
              }
            }
          });
        }

        test("doesn't overlap adjacent lines", () => {
          for (let lineIndex = 1; lineIndex < scenario.lines.length; ++lineIndex) {
            const lowestChildIndex = maxBy(scenario.lines[lineIndex - 1], (index) => end(children[index], crossAxis));
            const lowestChildPreviousLine = children[lowestChildIndex ?? 0];
            for (const childIndex of scenario.lines[lineIndex]) {
              assert.nonOverlapping.isAfter(children[childIndex], lowestChildPreviousLine, crossAxis);
            }
          }
        });
      });
    });
  });

  describe("addElement", () => {
    test("adds the child to its children list", () => {
      const group = new GridGroup();
      const child = elem(5, 8, 30, 5);
      const currentChildCount = group.children.length;

      group.addElement(child, { startColumn: 0, endColumn: 0 });

      assert.equal(group.children.length, currentChildCount + 1);
      assert.contains(group.children, child);
    });

    test("sets the parent of children elements to itself", () => {
      const group = new GridGroup();
      const child = elem(5, 8, 30, 5);

      group.addElement(child, { startColumn: 0, endColumn: 0 });

      assert.equal(child.parent, group);
    });
  });
});
