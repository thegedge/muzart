import type { Score } from "@muzart/notation";
import clsx from "clsx";
import { range } from "lodash-es";
import { observer } from "mobx-react-lite";
import type { ChangeEvent } from "preact/compat";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import { useMuzartContextMenu } from "../useMuzartContextMenu";
import { MeasureBox } from "./MeasureBox";

export const MeasureArea = observer((props: { score: Score }) => {
  const { selection } = useApplicationState();

  const onMeasureChange = (event: ChangeEvent<HTMLElement>) => {
    const part = event.currentTarget.dataset.part;
    const measure = event.currentTarget.dataset.measure;
    selection.update({
      partIndex: part ? parseInt(part) : undefined,
      measureIndex: measure ? parseInt(measure) : undefined,
    });
  };

  const numMeasures = props.score.parts[0]?.measures.length ?? 0;

  return (
    <div
      className="grid flex-1 items-stretch justify-stretch gap-px bg-gray-950/75"
      style={{
        gridTemplateColumns: `repeat(${numMeasures}, 1.75rem)`,
        gridAutoRows: "1.75rem", // h-7
        gridTemplateRows: "2rem", // h-8
      }}
    >
      {range(numMeasures).map((measureIndex) => {
        const partWithMarker = props.score.parts.find((p) => p.measures[measureIndex].marker);
        const marker = partWithMarker?.measures[measureIndex].marker;
        const showNumber = measureIndex == 0 || measureIndex % 10 == 9;
        const className = clsx(
          "sticky left-0 top-0 flex items-center font-light bg-gray-950/75",
          marker ? "text-2xs z-20 justify-start whitespace-nowrap pl-1 text-gray-400" : "justify-center z-10",
        );

        return (
          <div key={measureIndex} className={className}>
            {marker ? (
              <div className="relative bg-gray-950/75">{marker.text}</div>
            ) : showNumber ? (
              measureIndex + 1
            ) : null}
          </div>
        );
      })}
      {props.score.parts.map((part, partIndex) => {
        const contextMenuHandlers = useMuzartContextMenu(part);
        const partColor = part.color ?? "rgb(156, 163, 175)";
        return (
          <div key={partIndex} className="contents" {...contextMenuHandlers}>
            {part.measures.map((measure) => (
              <MeasureBox
                key={measure.number}
                partIndex={partIndex}
                measure={measure}
                color={partColor}
                onChange={onMeasureChange}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
});
