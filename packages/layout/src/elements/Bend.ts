import * as notation from "@muzart/notation";
import { DEFAULT_SANS_SERIF_FONT_FAMILY, LINE_STROKE_WIDTH, minMap, STAFF_LINE_HEIGHT } from "..";
import { SimpleGroup } from "../layouts/SimpleGroup";
import { Path } from "./Path";
import { Text } from "./Text";
import { Box } from "../utils/Box";

// Half width of the arrow heads
const HEAD_HALFW = 4 * LINE_STROKE_WIDTH;

export class Bend extends SimpleGroup<"Bend", Path | Text> {
  readonly type = "Bend";
  readonly descent: number;

  constructor(
    readonly bend: notation.Bend,
    note: notation.Note,
  ) {
    super(new Box(0, 0, bend.points.length * STAFF_LINE_HEIGHT, 3 * STAFF_LINE_HEIGHT));
    this.descent = ((note.placement?.string || 1) - 0.5) * STAFF_LINE_HEIGHT;
  }

  layout() {
    this.children.length = 0;

    const points = bendPoints(this);

    // The last largest point in the point array is where we will center the text
    const largestValue = minMap(points, (p) => p[1]);
    const referencePoint = points.findLast((p) => p[1] == largestValue);
    const bendTextX = referencePoint ? referencePoint[0] : points[0][0];
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

const bendArrowHeads = (points: readonly (readonly [number, number])[]) => {
  let previous = points[0];
  return points.slice(1).map((point, index) => {
    const [x, y] = point;
    const [_, py] = previous;
    previous = point;
    if (py > y + 1e-5) {
      return new Path2D(`
        M ${x - HEAD_HALFW},${y + 2 * HEAD_HALFW}
        L ${x + HEAD_HALFW},${y + 2 * HEAD_HALFW}
        L ${x},${y}
        M ${x - HEAD_HALFW},${y + 2 * HEAD_HALFW}
      `);
    } else if (py + 1e-5 < y) {
      return new Path2D(`
        M ${x - HEAD_HALFW},${y - 2 * HEAD_HALFW}
        L ${x + HEAD_HALFW},${y - 2 * HEAD_HALFW}
        L ${x},${y}
        M ${x - HEAD_HALFW},${y - 2 * HEAD_HALFW}
      `);
    } else if (index == points.length - 2) {
      return new Path2D(`
        M ${x - 2 * HEAD_HALFW},${y - HEAD_HALFW}
        L ${x + LINE_STROKE_WIDTH},${y}
        L ${x - 2 * HEAD_HALFW},${y + HEAD_HALFW}
        M ${x - HEAD_HALFW},${y - 2 * HEAD_HALFW}
      `);
    }
  });
};

const bendPoints = (bend: Bend): (readonly [number, number])[] => {
  // This is half the width of note text :(
  const x = 0.5 * STAFF_LINE_HEIGHT;

  // Don't go all the way to the end of the box, because it'll be too close to the next chord
  const w = 0.8 * bend.box.width;

  // Bend text is STAFF_LINE_HEIGHT, but add a bit more for some spacing
  const y = 1.25 * STAFF_LINE_HEIGHT;

  // Offset some from the descent bottom,
  const b = bend.box.height + bend.descent - 0.25 * STAFF_LINE_HEIGHT;

  const points = bend.bend.points.map((pt) => [x + pt.time * w, b - pt.amplitude * (b - y)] as const);
  if (bend.bend.points[0].amplitude > 0) {
    points.unshift([x, b]);
  }

  return points;
};

export const bendPath = (points: readonly (readonly [number, number])[]) => {
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
