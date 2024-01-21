import { clamp, range } from "lodash";
import { observable } from "mobx";
import { observer } from "mobx-react-lite";
import { JSX } from "preact";
import { useMemo, useRef } from "preact/hooks";
import { bendPath } from "../../../layout/elements/Bend";
import { Bend, BendPoint, BendType, defaultBendPointsForType } from "../../../notation";
import { changeNoteAction } from "../../actions/editing/ChangeNote";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { useDrag } from "../../utils/useDrag";
import { Modal } from "../misc/Modal";

type ObservableBend = Bend & {
  setType(type: BendType): void;
  setAmplitude(value: number): void;
  addBendPoint(time: number, amplitude: number): BendPoint | undefined;
  removeBendPoint(point: BendPoint): void;
};

export const BendEditor = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  if (!application.state.editingBend) {
    return null;
  }

  return <BendEditorInner />;
});

const BendEditorInner = observer((_props: Record<string, never>) => {
  const application = useApplicationState();

  const bend = useMemo((): ObservableBend => {
    const maybeBend = application.selection.note?.note?.bend;
    const copyBend = maybeBend
      ? {
          type: maybeBend.type,
          amplitude: maybeBend.amplitude,
          points: observable(maybeBend.points.map((v) => v)),
        }
      : {
          type: BendType.Bend,
          amplitude: 1,
          points: defaultBendPointsForType(BendType.Bend),
        };

    return observable({
      ...copyBend,

      addBendPoint(time: number, amplitude: number) {
        const index = this.points.findIndex((point) => time < point.time);
        if (index == -1) {
          // TODO should never happen, but perhaps some weird event outside the 0-1 range so we could create something just inside
        } else {
          const point = observable({ time, amplitude });
          this.points.splice(index, 0, point);
          return point;
        }
      },

      removeBendPoint(point: BendPoint) {
        this.points.splice(this.points.indexOf(point), 1);
      },

      setType(type: BendType) {
        this.type = type;
        this.points = defaultBendPointsForType(type);
      },

      setAmplitude(value: number) {
        this.amplitude = value;
      },
    });
  }, [application.selection.note]);

  return (
    <Modal title="Bend">
      <div className="flex flex-row items-center justify-between gap-4">
        <BendPointGrid bend={bend} className="min-w-[50vw] flex-1" />
        <BendFormControls bend={bend} />
      </div>
    </Modal>
  );
});

const BendFormControls = observer((props: { bend: ObservableBend }) => {
  const application = useApplicationState();
  const bend = props.bend;

  const clearBend = () => {
    if (application.selection.note?.note.bend) {
      application.dispatch(changeNoteAction({ bend: undefined }));
    }
    application.state.toggleEditingBend();
  };

  const setBend = () => {
    if (application.selection.note) {
      application.dispatch(
        changeNoteAction({
          bend: {
            type: bend.type,
            amplitude: bend.amplitude,
            points: bend.points,
          },
        }),
      );
    }
    application.state.toggleEditingBend();
  };

  return (
    <div className="flex flex-col items-stretch justify-between gap-y-4 self-stretch">
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-2">
          <label for="name" className="font-bold">
            Type:
          </label>
          <select
            name="type"
            size={Object.values(BendType).length}
            className="overflow-clip rounded p-2"
            onChange={(event) => bend.setType(event.currentTarget.value as BendType)}
          >
            {Object.values(BendType).map((bendType) => (
              <option key={bendType} selected={bendType == bend.type}>
                {bendType}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-x-2">
            <label for="amplitude" className="font-bold">
              Amplitude:
            </label>
            <div className="flex-1">{bend.amplitude}</div>
          </div>
          <input
            type="range"
            name="amplitude"
            step="0.1"
            min="0.1"
            max="5"
            value={bend.amplitude}
            className="col-span-2 flex"
            onChange={(event) => bend.setAmplitude(Number(event.currentTarget.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2">
        <button
          className="rounded border border-red-300/50 bg-red-200 px-4 py-1 text-red-900"
          onClick={() => clearBend()}
        >
          Clear
        </button>
        <button
          className="rounded border border-gray-400/50 bg-gray-300 px-4 py-1 text-gray-900"
          onClick={() => setBend()}
        >
          Set
        </button>
      </div>
    </div>
  );
});

const MIN_X = 0;
const MIN_Y = -400;
const WIDTH = 500;
const HEIGHT = -MIN_Y;

const NUM_MAJOR_TICKS_X = 5;
const NUM_MINOR_TICKS_PER_MAJOR_TICK_X = 5;
const NUM_MINOR_TICKS_PER_MAJOR_TICK_Y = 3;

const BendPointGrid = observer((props: { bend: ObservableBend; className?: string }) => {
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
