import { reaction } from "mobx";
import { useEffect, useMemo, useState } from "preact/hooks";
import type { JSXInternal } from "preact/src/jsx";
import type { Measure } from "../../../../notation";
import { useApplicationState } from "../../../utils/ApplicationStateContext";

export const MeasureBox = (props: {
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

export const replaceAlpha = (rgb: string, a: number) => {
  const prefix = rgb.substring(0, rgb.length - 1);
  return `${prefix}, ${a})`;
};
