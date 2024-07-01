import { SpeakerWaveIcon } from "@heroicons/react/24/outline";
import { PlayCircleIcon as SoloIcon } from "@heroicons/react/24/solid";
import { range } from "lodash";
import { observer } from "mobx-react-lite";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import { PartRow } from "./PartRow";

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
    <div className="part-panel flex h-full w-full flex-col overflow-auto">
      <div className="grid-cols-part-list grid items-center gap-y-px bg-gray-950/75">
        <div className="backdrop-blur-2xs sticky left-0 top-0 z-20 flex h-7 items-center gap-px bg-inherit">
          <div className="flex-1 px-4">Track</div>
          <div className="flex w-6 items-center justify-center p-0.5 text-gray-500">
            <SoloIcon title="Solo tracks" />
          </div>
          <div className="flex w-6 items-center justify-center p-0.5 text-gray-500">
            <SpeakerWaveIcon title="Muted tracks" />
          </div>
        </div>
        <div className="backdrop-blur-2xs sticky left-0 top-0 z-10 flex h-7 gap-px bg-inherit text-xs">
          {range(numMeasures).map((measureIndex) => {
            const marker = score.score.parts[0]?.measures[measureIndex]?.marker;
            const showNumber = measureIndex == 0 || measureIndex % 10 == 9;
            return (
              <div
                key={measureIndex}
                className={`relative flex h-6 w-6 items-center font-light ${
                  marker ? "text-2xs justify-start whitespace-nowrap pl-1 text-gray-400" : "justify-center"
                }`}
              >
                {marker ? (
                  <div className="relative z-10 bg-gray-950/75">{marker.text}</div>
                ) : showNumber ? (
                  measureIndex + 1
                ) : null}
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
