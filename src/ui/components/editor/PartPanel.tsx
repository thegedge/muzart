import { range } from "lodash";
import { observer } from "mobx-react-lite";
import React, { JSX } from "react";
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
    <div className="max-h-64 w-full flex flex-col bg-black text-gray-300 overflow-auto">
      <div className="grid grid-cols-part-list items-center gap-px">
        <div className="px-4 text-gray-200">Track</div>
        <div className="text-gray-200 flex gap-px">
          {range(numMeasures).map((measureIndex) => (
            <div key={measureIndex} className="w-6 h-6 text-xs flex items-center justify-center">
              <div>{(measureIndex == 0 || measureIndex % 10 == 9) && measureIndex + 1}</div>
            </div>
          ))}
        </div>

        {score.score.parts.map((part, partIndex) => {
          return <PartRow key={partIndex} part={part} partIndex={partIndex} onChange={onMeasureChange} />;
        })}
      </div>
    </div>
  );
});

const PartRow = observer((props: { part: Part; partIndex: number; onChange: JSX.MouseEventHandler<HTMLElement> }) => {
  const { part, partIndex, onChange } = props;
  const { selection } = useApplicationState();
  const partColor = part.color ?? "rgb(156, 163, 175)";
  const rowBackgroundColor = part == selection.part?.part ? "bg-gray-700" : "bg-gray-800";

  return (
    <>
      <div
        className={`flex h-full text-xs font-extralight items-center px-4 cursor-pointer ${rowBackgroundColor}`}
        onClick={onChange}
        data-part={partIndex}
      >
        {part.name}
      </div>
      <div className="flex gap-px items-center cursor-pointer">
        {part.measures.map((measure, measureIndex) => (
          <MeasureBox
            key={`${measureIndex}-${measureIndex == selection.measureIndex ? "-selected" : ""}`}
            partIndex={partIndex}
            measure={measure}
            color={partColor}
            onChange={onChange}
          />
        ))}
      </div>
    </>
  );
});

// Parent is observed, and will re-render all children
const MeasureBox = (props: {
  measure: Measure;
  partIndex: number;
  color: string;
  onChange: JSX.IntrinsicElements["div"]["onClick"];
}) => {
  const { selection, playback } = useApplicationState();
  const { measure, partIndex, color, onChange } = props;

  const currentMeasure =
    playback.playing && playback.currentMeasure ? playback.currentMeasure.measure.number : selection.measureIndex + 1;

  const baseOpacity = partIndex == selection.partIndex ? 0.6 : 0.4;
  const opacity = baseOpacity + 0.4 * measure.chords.reduce((sum, ch) => sum + (ch.rest ? 0 : ch.value.toDecimal()), 0);

  return (
    <div
      className="w-6 h-6 p-1 rounded-sm"
      style={{ backgroundColor: replaceAlpha(color, opacity) }}
      onClick={onChange}
      data-measure={measure.number - 1}
      data-part={partIndex}
    >
      {partIndex == selection.partIndex && measure.number == currentMeasure && (
        <div className="w-full h-full rounded-sm bg-white/50" />
      )}
    </div>
  );
};

const replaceAlpha = (rgb: string, a: number) => {
  const prefix = rgb.substring(0, rgb.length - 1);
  return `${prefix}, ${a})`;
};
