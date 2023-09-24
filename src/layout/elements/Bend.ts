import types, { DEFAULT_SANS_SERIF_FONT_FAMILY, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "..";
import * as notation from "../../notation";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Box } from "../utils";
import { Path } from "./Path";
import { Text } from "./Text";

// Half width of the arrow heads
const HEAD_HALFW = 4 * LINE_STROKE_WIDTH;

export class Bend extends SimpleGroup<types.Path | types.Text, "Bend", types.LineElement> implements types.Bend {
  readonly type = "Bend";
  readonly descent: number;

  constructor(
    readonly bend: notation.Bend,
    note: notation.Note,
  ) {
    super(new Box(0, 0, 0, 2.5 * STAFF_LINE_HEIGHT));
    this.descent = ((note.placement?.string || 1) - 0.5) * STAFF_LINE_HEIGHT;
  }

  layout() {
    this.children.length = 0;

    const points = bendPoints(this);
    const bendTextX = points[1][0];
    const bendTextY = 0.1 * STAFF_LINE_HEIGHT;
    const path = new Path2D(bendPath(points));
    this.addElement(new Path(this.box.update({ x: 0, y: 0 }), path));

    for (const head of bendArrowHeads(points)) {
      if (head) {
        const headPath = new Path(this.box.update({ x: 0, y: 0 }), head);
        headPath.style.fill = "#555555";
        headPath.style.stroke = "none";
        this.addElement(headPath);
      }
    }

    this.addElement(
      new Text({
        box: new Box(bendTextX, bendTextY, 0, 0),
        value: bendText(this.bend),
        size: STAFF_LINE_HEIGHT - bendTextY,
        style: {
          fontFamily: DEFAULT_SANS_SERIF_FONT_FAMILY,
          textAlign: "center",
          alignmentBaseline: "hanging",
          color: "#333333",
        },
      }),
    );
  }
}

const bendArrowHeads = (points: [number, number][]) => {
  let previous = points[0];
  return points.slice(1).map((point) => {
    const [x, y] = point;
    const [_, py] = previous;
    previous = point;
    if (py > y) {
      return new Path2D(`
        M ${x - HEAD_HALFW},${y + 2 * HEAD_HALFW}
        L ${x + HEAD_HALFW},${y + 2 * HEAD_HALFW}
        L ${x},${y}
        M ${x - HEAD_HALFW},${y + 2 * HEAD_HALFW}
      `);
    } else if (py < y) {
      return new Path2D(`
        M ${x - HEAD_HALFW},${y - 2 * HEAD_HALFW}
        L ${x + HEAD_HALFW},${y - 2 * HEAD_HALFW}
        L ${x},${y}
        M ${x - HEAD_HALFW},${y - 2 * HEAD_HALFW}
      `);
    }
  });
};

const bendPoints = (bend: types.Bend): [number, number][] => {
  // This is width of note text :(
  const x = 0.8 * STAFF_LINE_HEIGHT;

  // Don't go all the way to the end of the box, because it'll be too close to the next chord
  const w = 0.8 * bend.box.width;

  // Bend text is STAFF_LINE_HEIGHT, but add a bit more for some spacing
  const y = 1.25 * STAFF_LINE_HEIGHT;

  // Offset some from the descent bottom,
  const b = bend.box.height + bend.descent - 0.25 * STAFF_LINE_HEIGHT;

  switch (bend.bend.type) {
    case notation.BendType.Bend:
      return [
        [0, b],
        [w, y],
      ];
    case notation.BendType.BendRelease:
      return [
        [0, b],
        [w / 2, y],
        [w, b],
      ];
    case notation.BendType.BendReleaseBend:
      return [
        [0, b],
        [w / 3, y],
        [(2 * w) / 3, b],
        [w, y],
      ];
    case notation.BendType.Prebend:
      return [
        [0.5 * x, b],
        [0.5 * x, y],
      ];
    case notation.BendType.PrebendRelease:
      return [
        [0.5 * x, b],
        [0.5 * x, y],
        [w, b],
      ];
    default: {
      // TODO tremolos
      throw new Error(`Unsupported bend type: ${bend.bend.type}`);
    }
  }
};

const bendPath = (points: [number, number][]) => {
  let [px, py] = points[0];
  const path = [`M ${px},${py}`];
  for (const point of points.slice(1)) {
    const [x, y] = point;
    const w = x - px;
    const h = Math.abs(y - py);
    const endY = y + 2 * (py > y ? HEAD_HALFW : -HEAD_HALFW);

    if (w == 0 || h == 0) {
      path.push(`L ${x},${y}`);
    } else if (py > y) {
      path.push(`C ${px + 0.5 * w},${py} ${x},${endY + 0.7 * h} ${x},${endY}`);
    } else {
      // else if (previous[1] < y)
      path.push(`C ${px + 0.5 * w},${py} ${x},${endY - 0.7 * h} ${x},${endY}`);
    }

    path.push(`M ${x},${y}`);

    [px, py] = point;
  }

  return path.join(" ");
};

const bendText = (bend: notation.Bend) => {
  switch (bend.amplitude) {
    case 0.25:
      return "¼";
    case 0.5:
      return "½";
    case 0.75:
      return "¾";
    case 1:
      return "full";
    default:
      return "other";
  }
};
