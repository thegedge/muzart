import layout, { DEFAULT_SANS_SERIF_FONT_FAMILY, LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../../layout";
import { BendType } from "../../../notation";

// Half width of the arrow heads
const HEAD_HALFW = 4 * LINE_STROKE_WIDTH;

export const Bend = (context: CanvasRenderingContext2D, element: layout.Bend) => {
  const points = bendPoints(element);
  const bendTextX = points[1][0];
  const path = new Path2D(bendPath(points));

  context.save();
  context.translate(element.box.x, element.box.y);
  context.fillStyle = `#555555`;
  context.strokeStyle = `${LINE_STROKE_WIDTH} #555555`;
  context.stroke(path);

  for (const head of bendArrowHeads(points)) {
    if (head) {
      context.fill(head);
    }
  }

  context.font = `${0.9 * STAFF_LINE_HEIGHT}px ${DEFAULT_SANS_SERIF_FONT_FAMILY}`;
  context.textAlign = "center";
  context.textBaseline = "hanging";
  context.fillText(bendText(element), bendTextX, 0.1 * STAFF_LINE_HEIGHT);
  context.restore();
};

function bendArrowHeads(points: [number, number][]) {
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
      `);
    } else if (py < y) {
      return new Path2D(`
        M ${x - HEAD_HALFW},${y - 2 * HEAD_HALFW}
        L ${x + HEAD_HALFW},${y - 2 * HEAD_HALFW}
        L ${x},${y}
      `);
    }
  });
}

function bendPoints(bend: layout.Bend): [number, number][] {
  // This is width of note text :(
  const x = 0.8 * STAFF_LINE_HEIGHT;

  // Don't go all the way to the end of the box, because it'll be too close to the next chord
  const w = 0.8 * bend.box.width;

  // Bend text is STAFF_LINE_HEIGHT, but add a bit more for some spacing
  const y = 1.25 * STAFF_LINE_HEIGHT;

  // Offset some from the descent bottom,
  const b = bend.box.height + bend.descent - 0.25 * STAFF_LINE_HEIGHT;

  switch (bend.bend.type) {
    case BendType.Bend:
      return [
        [0, b],
        [w, y],
      ];
    case BendType.BendRelease:
      return [
        [0, b],
        [w / 2, y],
        [w, b],
      ];
    case BendType.BendReleaseBend:
      return [
        [0, b],
        [w / 3, y],
        [(2 * w) / 3, b],
        [w, y],
      ];
    case BendType.Prebend:
      return [
        [0.5 * x, b],
        [0.5 * x, y],
      ];
    case BendType.PrebendRelease:
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
}

function bendPath(points: [number, number][]) {
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
}

function bendText(bend: layout.Bend) {
  switch (bend.bend.amplitude) {
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
}
