import { range } from "lodash";
import { observable } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "preact/hooks";
import { bendPath } from "../../../layout/elements/Bend";
import { Bend, BendType, defaultBendPointsForType } from "../../../notation";
import { ChangeNote } from "../../actions/ChangeNote";
import { useApplicationState } from "../../utils/ApplicationStateContext";

type ObservableBend = Bend & {
  setType(type: BendType): void;
  setAmplitude(value: number): void;
};

export const BendEditor = observer((_props: Record<string, never>) => {
  const application = useApplicationState();

  const bend = useMemo((): ObservableBend => {
    const bend = application.selection.note?.note.bend ?? {
      type: BendType.Bend,
      amplitude: 1,
      points: defaultBendPointsForType(BendType.Bend),
    };

    return observable({
      ...bend,

      setType(type: BendType) {
        this.type = type;
        this.points = defaultBendPointsForType(type);
      },

      setAmplitude(value: number) {
        this.amplitude = value;
      },
    });
  }, [application.selection.note]);

  // TODO create an action and dispatch these instead

  const clearBend = () => {
    if (application.selection.note?.note.bend) {
      application.dispatch(new ChangeNote({ bend: undefined }));
    }
    application.state.toggleEditingBend();
  };

  const setBend = () => {
    if (application.selection.note) {
      application.dispatch(
        new ChangeNote({
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
    <div
      className={`flex items-center justify-center absolute z-top backdrop-blur-sm backdrop-brightness-50 top-0 bottom-0 left-0 right-0 p-16 ${
        application.state.editingBend ? "block" : "hidden"
      }`}
    >
      <div className="flex-1 flex items-start justify-start p-4 shadow-modal bg-gray-200 rounded gap-4">
        <BendPointGrid bend={bend} />

        <div className="flex flex-col items-stretch justify-between gap-y-4 self-stretch">
          <div className="flex flex-col gap-y-4">
            <select
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

            <div className="grid grid-cols-2 gap-x-2">
              <label for="amplitude" className="font-bold">
                Amplitude:
              </label>
              <div>{bend.amplitude}</div>
              <input
                type="range"
                name="amplitude"
                min="0.1"
                max="5"
                step="0.1"
                value={bend.amplitude}
                className="flex col-span-2"
                onChange={(event) => bend.setAmplitude(Number(event.currentTarget.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-2">
            <button
              className="bg-red-200 border border-red-300/50 text-red-900 px-4 py-1 rounded"
              onClick={() => clearBend()}
            >
              Clear
            </button>
            <button
              className="bg-gray-300 border border-gray-400/50 text-gray-900 px-4 py-1 rounded"
              onClick={() => setBend()}
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

const BendPointGrid = observer(({ bend }: { bend: ObservableBend }) => {
  const minX = 0;
  const minY = -400;
  const width = 500;
  const height = -minY;

  const points = bend.points.map(
    (point) => [minX + point.time * width, minY + height - point.amplitude * height] as const,
  );

  return (
    <svg className="stroke-1" viewBox={`${minX - 6} ${minY - 6} ${width + 2 * 6} ${height + 2 * 6}`}>
      <rect x={minX} y={minY} width={width} height={height} className="fill-gray-800" />

      <g>
        {range(1, 5 * Math.ceil(bend.amplitude)).map((value) => (
          <line
            key={`minor-v-${value}`}
            x1={minX + 0.5}
            y1={minY + height - (height * value) / (5 * bend.amplitude)}
            x2={minX + width}
            y2={minY + height - (height * value) / (5 * bend.amplitude)}
            className="stroke-gray-700"
          />
        ))}

        {range(1, 30).map((value) => (
          <line
            key={`minor-h-${value}`}
            x1={minX + (width * value) / 30}
            y1={minY + 0.5}
            x2={minX + (width * value) / 30}
            y2={minY + height}
            className="stroke-gray-700"
          />
        ))}

        {range(1, Math.ceil(bend.amplitude)).map((value) => (
          <line
            key={`major-v-${value}`}
            x1={minX + 0.5}
            y1={minY + height - (height * value) / bend.amplitude}
            x2={minX + width}
            y2={minY + height - (height * value) / bend.amplitude}
            className="stroke-gray-500"
          />
        ))}

        {range(1, 3).map((value) => (
          <line
            key={`major-h-${value}`}
            x1={minX + (width * value) / 3}
            y1={minY + 0.5}
            x2={minX + (width * value) / 3}
            y2={minY + height}
            className="stroke-gray-500"
          />
        ))}
      </g>

      <path d={bendPath(points)} className="stroke-2 stroke-lime-600 fill-none" />

      {bend.points.map((point, index) => (
        <circle
          key={index}
          cx={point.time * 500}
          cy={point.amplitude * -400}
          r="5"
          className="fill-gray-200 stroke-gray-700 cursor-grab"
        />
      ))}
    </svg>
  );
});
