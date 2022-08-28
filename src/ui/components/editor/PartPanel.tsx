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
      <div className="grid grid-cols-part-list items-center gap-x-px gap-y-px">
        <div className="px-4 text-gray-200">Track</div>
        <div className="text-gray-200 flex gap-px justify-center items-center">
          {range(numMeasures).map((measureIndex) => (
            <div key={measureIndex} className="w-6 text-xs text-center">
              {(measureIndex == 0 || measureIndex % 10 == 9) && measureIndex + 1}
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
  const globalClasses = ["cursor-pointer", "h-full"].join(" ");

  return (
    <>
      <div className={`px-4 ${rowBackgroundColor} ${globalClasses}`} onClick={onChange} data-part={partIndex}>
        {part.name}
      </div>
      <div className={`flex gap-px items-center align-middle ${globalClasses}`}>
        {part.measures.map((measure, measureIndex) => (
          <MeasureBox
            key={measureIndex}
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

const MeasureBox = observer(
  (props: {
    measure: Measure;
    partIndex: number;
    color: string;
    onChange: JSX.IntrinsicElements["div"]["onClick"];
  }) => {
    const { selection, playback } = useApplicationState();
    const { measure, partIndex, color, onChange } = props;
    const rowBackgroundColor = partIndex == selection.partIndex ? "bg-gray-700" : "bg-gray-800";

    const currentMeasure =
      playback.playing && playback.currentMeasure ? playback.currentMeasure.measure.number : selection.measureIndex + 1;
    const opacity = 0.25 + 0.75 * measure.chords.reduce((sum, ch) => sum + (ch.rest ? 0 : ch.value.toDecimal()), 0);

    return (
      <div className={rowBackgroundColor}>
        <div
          className="w-6 h-6 p-1"
          style={{ backgroundColor: replaceAlpha(color, opacity) }}
          onClick={onChange}
          data-measure={measure.number - 1}
          data-part={partIndex}
        >
          {partIndex == selection.partIndex && measure.number == currentMeasure && (
            <div className="w-full h-full rounded-sm bg-white/50">&nbsp;</div>
          )}
        </div>
      </div>
    );
  }
);

const replaceAlpha = (rgb: string, a: number) => {
  const prefix = rgb.substring(0, rgb.length - 1);
  return `${prefix}, ${a})`;
};
