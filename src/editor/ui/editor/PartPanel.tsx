import { range } from "lodash";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "preact/hooks";
import { JSXInternal } from "preact/src/jsx";
import { Ear, EarFill, Mic, MicMute } from "react-bootstrap-icons";
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
    <div className="w-full max-h-48 flex flex-col bg-gray-900 text-gray-200 overflow-y-auto">
      <div className="grid grid-cols-part-list gap-y-px bg-inherit overflow-auto items-center">
        <div className="flex items-center gap-px bg-inherit sticky z-10 left-0 top-0 h-7">
          <div className="flex-1 px-4">Track</div>
          <div className="flex items-center justify-center w-6 text-gray-500">
            <Ear title="Solo tracks" />
          </div>
          <div className="flex items-center justify-center w-6 text-gray-500">
            <MicMute title="Muted tracks" />
          </div>
        </div>
        <div className="flex gap-px text-xs bg-inherit sticky z-10 left-0 top-0 h-7">
          {range(numMeasures).map((measureIndex) => {
            const marker = score.score.parts[0]?.measures[measureIndex]?.marker;
            const showNumber = measureIndex == 0 || measureIndex % 10 == 9;
            return (
              <div
                key={measureIndex}
                className={`w-6 h-6 flex items-center font-light ${
                  marker
                    ? "pl-1 text-2xs whitespace-nowrap justify-start text-gray-400 bg-inherit"
                    : showNumber
                    ? "justify-center bg-inherit" // if a marker happens to flow into a number, the two won't "clash"
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
    const rowBackgroundColor = partIndex == selection.partIndex ? "bg-gray-700" : "bg-gray-800";

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
        <div className={`flex gap-px h-full sticky left-0 pr-px ${rowBackgroundColor}`}>
          <div
            className={`flex flex-1 sticky h-full text-xs font-extralight items-center px-4 cursor-pointer`}
            onClick={onChange}
            data-part={partIndex}
          >
            {part.name}
          </div>
          <button type="button" name="solo" onClick={toggleSolo} className="flex items-center justify-center w-6 h-6">
            {playback.soloedParts[partIndex] ? (
              <EarFill className="text-white" title="Only play this track" />
            ) : (
              <Ear className="text-gray-500" title="Only play this track" />
            )}
          </button>
          <button type="button" name="mute" onClick={toggleMute} className="flex items-center justify-center w-6 h-6">
            {playback.mutedParts[partIndex] ? (
              <MicMute className="text-white" title="Mute this track" />
            ) : (
              <Mic className="text-gray-500" title="Mute this track" />
            )}
          </button>
        </div>
        <div className="flex gap-px items-center cursor-pointer bg-gray-900">
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
  },
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

  const baseOpacity = partIndex == selection.partIndex ? 0.3 : 0.2;
  const scale = partIndex == selection.partIndex ? 1 : 0.4;
  const nonRestDuration = measure.chords.reduce((sum, ch) => sum + (ch.rest ? 0 : ch.value.toDecimal()), 0);
  const opacity = baseOpacity + (1 - baseOpacity) * scale * Math.sqrt(nonRestDuration);

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
      { fireImmediately: true },
    );
  }, [measure.number, partIndex, playback, selection]);

  return (
    <div
      className="w-6 h-6 p-0.8 rounded-sm flex justify-center items-center text-2xs"
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
