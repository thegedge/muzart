import React from "react";
import { BendType } from "../../../notation";
import layout, { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT } from "../../layout";
import { BoxGroup } from "../layout/BoxGroup";

const BEND_COLOR = "#555555";

export const Bend = (props: { node: layout.Bend }) => {
  const points = bendPoints(props.node);
  const bendTextX = points[1][0];

  return (
    <BoxGroup node={props.node}>
      <path d={bendPath(points)} fill="none" stroke={BEND_COLOR} strokeWidth={LINE_STROKE_WIDTH} />
      {bendArrowHeads(points)}
      <text
        x={bendTextX}
        y={0.1 * STAFF_LINE_HEIGHT}
        dominantBaseline="hanging"
        textAnchor="middle"
        fontSize={0.9 * STAFF_LINE_HEIGHT}
        fill={BEND_COLOR}
      >
        {bendText(props.node)}
      </text>
    </BoxGroup>
  );
};

function bendArrowHeads(points: [number, number][]) {
  // "radius" of the arrow heads
  const hr = 4 * LINE_STROKE_WIDTH;
  let previous = points[0];
  return (
    <>
      {points.slice(1).map((point, index) => {
        const [x, y] = point;
        const [_, py] = previous;
        previous = point;
        if (py > y) {
          return (
            <polyline
              key={index}
              points={`${x - hr},${y + 2 * hr} ${x + hr},${y + 2 * hr} ${x},${y}`}
              fill={BEND_COLOR}
              stroke="none"
            />
          );
        } else if (py < y) {
          return (
            <polyline
              key={index}
              points={`${x - hr},${y - 2 * hr} ${x + hr},${y - 2 * hr} ${x},${y}`}
              fill={BEND_COLOR}
              stroke="none"
            />
          );
        }
      })}
    </>
  );
}

function bendPoints(bend: layout.Bend): [number, number][] {
  // This is width of note text :(
  const x = STAFF_LINE_HEIGHT;

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
    if (w == 0 || h == 0) {
      path.push(`L ${x},${y}`);
    } else if (py > y) {
      path.push(`C ${px + 0.75 * w},${py} ${x},${y + 0.75 * h} ${x},${y}`);
    } else {
      // else if (previous[1] < y)
      path.push(`C ${px + 0.75 * w},${py} ${x},${y - 0.75 * h} ${x},${y}`);
    }

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
