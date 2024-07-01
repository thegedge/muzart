import { bendPath } from "@muzart/layout";
import type { Bend, BendPoint } from "@muzart/notation";
import { clamp, range } from "lodash-es";
import { observer } from "mobx-react-lite";
import type { JSX } from "preact";
import { useRef } from "preact/hooks";
import { useDrag } from "../../../utils/useDrag";
import { type ObservableBend } from "./BendEditor";

const MIN_X = 0;
const MIN_Y = -400;
const WIDTH = 500;
const HEIGHT = -MIN_Y;

const NUM_MAJOR_TICKS_X = 5;
const NUM_MINOR_TICKS_PER_MAJOR_TICK_X = 5;
const NUM_MINOR_TICKS_PER_MAJOR_TICK_Y = 3;

export const BendPointGrid = observer((props: { bend: ObservableBend; className?: string }) => {
  const bend = props.bend;
  const points = bend.points.map(
    (point) => [MIN_X + point.time * WIDTH, MIN_Y + HEIGHT - point.amplitude * HEIGHT] as const,
  );

  const svg = useRef<SVGSVGElement>(null);
  const startingValues = useRef<[number, number] | null>(null);

  const { startDrag } = useDrag<BendPoint>({
    boundedBy: svg,

    onDrag: (dragging, px, py, event) => {
      const pointIndex = bend.points.indexOf(dragging);

      let minX = 0;
      let maxX = 0;
      if (pointIndex == 0) {
        minX = 0;
        maxX = 0;
      } else if (pointIndex == bend.points.length - 1) {
        minX = 1;
        maxX = 1;
      } else if (event.shiftKey && startingValues.current) {
        minX = startingValues.current[0];
        maxX = startingValues.current[0];
      } else {
        minX = bend.points[pointIndex - 1].time;
        maxX = bend.points[pointIndex + 1].time;
      }

      dragging.time = clamp(px, minX, maxX);
      dragging.amplitude = 1 - py;
    },

    onDragStart: (dragging) => {
      startingValues.current = [dragging.time, dragging.amplitude];
    },
  });

  const onPointerDown: JSX.PointerEventHandler<SVGSVGElement> = (event) => {
    event.preventDefault();

    // If we clicked on a bend point handle, remove it if we held the meta key, otherwise start dragging it
    if (event.target instanceof Element) {
      const bendPointHandle = event.target.closest("[data-bendpoint-index]");
      if (bendPointHandle) {
        const index = Number(bendPointHandle.getAttribute("data-bendpoint-index"));
        if (event.metaKey && index > 0 && index < bend.points.length - 1) {
          bend.removeBendPoint(bend.points[index]);
        } else {
          event.currentTarget.setPointerCapture(event.pointerId);
          startDrag(bend.points[index]);
        }
        return;
      }
    }

    // If we clicked on the grid, add a new bend point and start dragging it
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1.0 - (event.clientY - rect.top) / rect.height;
    const point = bend.addBendPoint(x, y);
    if (point) {
      event.currentTarget.setPointerCapture(event.pointerId);
      startDrag(point);
    }
  };

  return (
    <svg
      ref={svg}
      className={`-m-1.5 stroke-1 ${props.className ?? ""}`}
      viewBox={`${MIN_X - 6} ${MIN_Y - 6} ${WIDTH + 2 * 6} ${HEIGHT + 2 * 6}`}
      onPointerDown={(event) => onPointerDown(event)}
    >
      <rect x={MIN_X} y={MIN_Y} width={WIDTH} height={HEIGHT} className="fill-gray-800" />

      <g>
        {range(0, HEIGHT + 1, HEIGHT / ((NUM_MINOR_TICKS_PER_MAJOR_TICK_Y + 1) * bend.amplitude)).map((value) => (
          <line
            key={`minor-h-${value}`}
            x1={MIN_X + 0.5}
            y1={MIN_Y + HEIGHT - value}
            x2={MIN_X + WIDTH - 0.5}
            y2={MIN_Y + HEIGHT - value}
            className="stroke-gray-700"
          />
        ))}

        {range(0, WIDTH + 1, WIDTH / ((NUM_MINOR_TICKS_PER_MAJOR_TICK_X + 1) * (NUM_MAJOR_TICKS_X + 1))).map(
          (value) => (
            <line
              key={`minor-v-${value}`}
              x1={MIN_X + value}
              y1={MIN_Y + 0.5}
              x2={MIN_X + value}
              y2={MIN_Y + HEIGHT - 0.5}
              className="stroke-gray-700"
            />
          ),
        )}

        {range(0, HEIGHT + 1, HEIGHT / bend.amplitude).map((value) => (
          <line
            key={`major-h-${value}`}
            x1={MIN_X + 0.5}
            y1={MIN_Y + HEIGHT - value}
            x2={MIN_X + WIDTH - 0.5}
            y2={MIN_Y + HEIGHT - value}
            className="stroke-gray-500"
          />
        ))}

        {range(0, WIDTH + 1, WIDTH / (NUM_MAJOR_TICKS_X + 1)).map((value) => (
          <line
            key={`major-v-${value}`}
            x1={MIN_X + value}
            y1={MIN_Y + 0.5}
            x2={MIN_X + value}
            y2={MIN_Y + HEIGHT - 0.5}
            className="stroke-gray-500"
          />
        ))}
      </g>

      <path d={bendPath(points)} className="fill-none stroke-lime-600 stroke-2" />

      {bend.points.map((point, index) => (
        <BendPointHandle key={index} bend={bend} point={point} />
      ))}
    </svg>
  );
});

const BendPointHandle = observer((props: { bend: Bend; point: BendPoint }) => {
  const pointIndex = props.bend.points.indexOf(props.point);

  return (
    <circle
      r={WIDTH / 100}
      cx={MIN_X + props.point.time * WIDTH}
      cy={MIN_Y + HEIGHT - props.point.amplitude * HEIGHT}
      data-bendpoint-index={pointIndex}
      className="cursor-grab fill-gray-200 stroke-gray-700"
    />
  );
});
