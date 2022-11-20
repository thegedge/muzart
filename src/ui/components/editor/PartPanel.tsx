import { range } from "lodash";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "preact/hooks";
import { JSXInternal } from "preact/src/jsx";
import { Measure, Part } from "../../../notation";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export const PartPanel = observer((_props: Record<string, never>) => {
  const { selection } = useApplicationState();
  const score = selection.score;
  if (!score) {
    return null;
  }

  const onMeasureChange = (event: React.ChangeEvent<HTMLElement>) => {
    const part = event.currentTarget.dataset.part;
    const measure = event.currentTarget.dataset.measure;
    selection.update({
      partIndex: part ? parseInt(part) : undefined,
      measureIndex: measure ? parseInt(measure) : undefined,
    });
  };

  const numMeasures = score.score.parts[0]?.measures.length ?? 0;

  return (
    <div className="max-h-48 w-full flex flex-col bg-black text-gray-300 overflow-auto">
      <div className="grid grid-cols-part-list items-center gap-px">
        <div className="px-4 text-gray-200">Track</div>
        <div className="text-center">S</div>
        <div className="text-center">M</div>
        <div className="text-gray-200 flex gap-px text-xs">
          {range(numMeasures).map((measureIndex) => {
            const marker = score.score.parts[0]?.measures[measureIndex]?.marker;
            const showNumber = measureIndex == 0 || measureIndex % 10 == 9;
            return (
              <div
                key={measureIndex}
                className={`w-6 h-6 flex items-center ${
                  marker
                    ? "pl-1 text-2xs whitespace-nowrap justify-start text-gray-400 bg-black"
                    : showNumber
                    ? "justify-center bg-black" // if a marker happens to flow into a number, the two won't "clash"
                    : "justify-center"
                }`}
              >
                {marker ? marker.text : showNumber ? measureIndex + 1 : null}
              </div>
            );
          })}
        </div>

        {score.score.parts.map((part, partIndex) => {
          return <PartRow key={partIndex} part={part} partIndex={partIndex} onChange={onMeasureChange} />;
        })}
      </div>
    </div>
  );
});

const PartRow = observer(
  (props: { part: Part; partIndex: number; onChange: JSXInternal.MouseEventHandler<HTMLElement> }) => {
    const { part, partIndex, onChange } = props;
    const { selection, playback } = useApplicationState();
    const partColor = part.color ?? "rgb(156, 163, 175)";
    const rowBackgroundColor = part == selection.part?.part ? "bg-gray-700" : "bg-gray-800";

    const toggleSolo: JSXInternal.GenericEventHandler<HTMLElement> = (event) => {
      event.preventDefault();
      playback.toggleSolo(props.partIndex);
    };

    const toggleMute: JSXInternal.GenericEventHandler<HTMLElement> = (event) => {
      event.preventDefault();
      playback.toggleMute(props.partIndex);
    };

    return (
      <>
        <div
          className={`flex h-full text-xs font-extralight items-center px-4 cursor-pointer ${rowBackgroundColor}`}
          onClick={onChange}
          data-part={partIndex}
        >
          {part.name}
        </div>
        <button
          type="button"
          name="solo"
          onClick={toggleSolo}
          className="bg-gray-500 text-gray-300 m-auto w-full h-full"
        >
          {playback.soloedParts[partIndex] ? "✓" : ""}
        </button>
        <button
          type="button"
          name="mute"
          onClick={toggleMute}
          className="bg-gray-500 text-gray-300 m-auto w-full h-full"
        >
          {playback.mutedParts[partIndex] ? "✓" : ""}
        </button>
        <div className="flex gap-px items-center cursor-pointer">
          {part.measures.map((measure) => (
            <MeasureBox
              key={measure.number}
              partIndex={partIndex}
              measure={measure}
              color={partColor}
              onChange={onChange}
            />
          ))}
        </div>
      </>
    );
  }
);

// Parent is observed, and will re-render all children
const MeasureBox = (props: {
  measure: Measure;
  partIndex: number;
  color: string;
  onChange: JSXInternal.MouseEventHandler<HTMLElement>;
}) => {
  const { measure, partIndex, color, onChange } = props;
  const { playback, selection } = useApplicationState();
  const [selected, setSelected] = useState(false);

  const baseOpacity = partIndex == selection.partIndex ? 0.6 : 0.4;
  const opacity = baseOpacity + 0.4 * measure.chords.reduce((sum, ch) => sum + (ch.rest ? 0 : ch.value.toDecimal()), 0);

  useEffect(() => {
    return reaction(
      () => {
        const currentMeasure =
          playback.playing && playback.currentMeasure
            ? playback.currentMeasure.measure.number
            : selection.measureIndex + 1;
        return partIndex == selection.partIndex && currentMeasure == measure.number;
      },
      (isSelected) => setSelected(isSelected),
      { fireImmediately: true }
    );
  }, [playback, selection]);

  return (
    <div
      className="w-6 h-6 p-0.8 rounded-sm flex justify-center items-center"
      style={{ backgroundColor: replaceAlpha(color, opacity) }}
      onClick={onChange}
      data-measure={measure.number - 1}
      data-part={partIndex}
    >
      {selected && <div className="flex justify-center items-center w-full h-full rounded-sm bg-white/50" />}
    </div>
  );
};

const replaceAlpha = (rgb: string, a: number) => {
  const prefix = rgb.substring(0, rgb.length - 1);
  return `${prefix}, ${a})`;
};
