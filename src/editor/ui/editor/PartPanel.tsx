import {
  SpeakerXMarkIcon as MuteIcon,
  SpeakerWaveIcon,
  SpeakerWaveIcon as UnmuteIcon,
  PlayCircleIcon as UnsoloIcon,
} from "@heroicons/react/24/outline";
import { PlayCircleIcon as SoloIcon } from "@heroicons/react/24/solid";
import { range } from "lodash";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "preact/hooks";
import { JSXInternal } from "preact/src/jsx";
import { Measure, Part } from "../../../notation";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { useMuzartContextMenu } from "./useMuzartContextMenu";

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
    <div className="part-panel flex max-h-48 w-full flex-col overflow-y-auto print:hidden">
      <div className="grid grid-cols-part-list items-center gap-y-px overflow-auto bg-gray-950/75 ">
        <div className="backdrop-blur-2xs sticky left-0 top-0 z-20 flex h-7 items-center gap-px bg-inherit ">
          <div className="flex-1 px-4">Track</div>
          <div className="flex w-6 items-center justify-center p-0.5 text-gray-500">
            <SoloIcon title="Solo tracks" />
          </div>
          <div className="flex w-6 items-center justify-center p-0.5 text-gray-500">
            <SpeakerWaveIcon title="Muted tracks" />
          </div>
        </div>
        <div className="backdrop-blur-2xs sticky left-0 top-0 z-10 flex h-7 gap-px bg-inherit text-xs ">
          {range(numMeasures).map((measureIndex) => {
            const marker = score.score.parts[0]?.measures[measureIndex]?.marker;
            const showNumber = measureIndex == 0 || measureIndex % 10 == 9;
            return (
              <div
                key={measureIndex}
                className={`flex h-6 w-6 items-center font-light ${
                  marker
                    ? "justify-start whitespace-nowrap pl-1 text-2xs text-gray-400"
                    : showNumber
                      ? "justify-center" // if a marker happens to flow into a number, the two won't "clash"
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

    const contextMenuHandlers = useMuzartContextMenu(part);

    return (
      <>
        <div className={`sticky left-0 flex h-full gap-px pr-px ${rowBackgroundColor}`} {...contextMenuHandlers}>
          <div
            className="sticky flex h-full flex-1 cursor-pointer items-center px-4 text-xs font-extralight shadow-black text-shadow"
            onClick={onChange}
            data-part={partIndex}
          >
            {part.name}
          </div>
          <button
            type="button"
            name="solo"
            onClick={toggleSolo}
            className="flex h-6 w-6 items-center justify-center p-0.5"
          >
            {playback.soloedParts[partIndex] ? (
              <UnsoloIcon className="text-white" title="Only play this track" />
            ) : (
              <SoloIcon className="text-gray-500" title="Only play this track" />
            )}
          </button>
          <button
            type="button"
            name="mute"
            onClick={toggleMute}
            className="flex h-6 w-6 items-center justify-center p-0.5"
          >
            {playback.mutedParts[partIndex] ? (
              <UnmuteIcon className="text-white" title="Mute this track" />
            ) : (
              <MuteIcon className="text-gray-500" title="Mute this track" />
            )}
          </button>
        </div>
        <div className="flex cursor-pointer items-center gap-px bg-gray-900 px-px" {...contextMenuHandlers}>
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
  const partIsSelected = partIndex == selection.partIndex;

  useEffect(() => {
    return reaction(
      () => {
        const currentMeasure =
          playback.playing && playback.currentMeasure
            ? playback.currentMeasure.measure.number
            : selection.measureIndex + 1;
        return partIsSelected && currentMeasure == measure.number;
      },
      (isSelected) => setSelected(isSelected),
      { fireImmediately: true },
    );
  }, [measure.number, partIsSelected, playback, selection]);

  const nonRestDuration = useMemo(() => {
    return measure.chords.reduce((sum, ch) => sum + (ch.rest ? 0 : ch.value.toDecimal()), 0);
  }, [measure.chords]);

  const baseOpacity = partIsSelected ? 0.3 : 0.2;
  const scale = partIsSelected ? 1 : 0.4;
  const opacity = baseOpacity + (1 - baseOpacity) * scale * Math.sqrt(nonRestDuration);

  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-sm p-0.8 text-2xs"
      style={{ backgroundColor: replaceAlpha(color, opacity) }}
      onClick={onChange}
      data-measure={measure.number - 1}
      data-part={partIndex}
    >
      {selected && <div className="flex h-full w-full items-center justify-center rounded-sm bg-white/50" />}
    </div>
  );
};

const replaceAlpha = (rgb: string, a: number) => {
  const prefix = rgb.substring(0, rgb.length - 1);
  return `${prefix}, ${a})`;
};
