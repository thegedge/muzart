import {
  SpeakerXMarkIcon as MuteIcon,
  SpeakerWaveIcon as UnmuteIcon,
  PlayCircleIcon as UnsoloIcon,
} from "@heroicons/react/24/outline";
import { PlayCircleIcon as SoloIcon } from "@heroicons/react/24/solid";
import { observer } from "mobx-react-lite";
import { useRef } from "preact/hooks";
import type { JSXInternal } from "preact/src/jsx";
import type { Part } from "../../../../notation";
import { ChangePartName } from "../../../actions/editing/ChangePartName";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import { useMuzartContextMenu } from "../useMuzartContextMenu";
import { MeasureBox } from "./MeasureBox";

export const PartRow = observer(
  (props: { part: Part; partIndex: number; onChange: JSXInternal.MouseEventHandler<HTMLElement> }) => {
    const { part, partIndex, onChange } = props;
    const { selection, playback } = useApplicationState();
    const partColor = part.color ?? "rgb(156, 163, 175)";
    const rowBackgroundColor = partIndex == selection.partIndex ? "bg-gray-700" : "bg-gray-800";

    const contextMenuHandlers = useMuzartContextMenu(part);
    const application = useApplicationState();
    const nameElementRef = useRef<HTMLDivElement>(null);

    const toggleSolo: JSXInternal.GenericEventHandler<HTMLElement> = (event) => {
      event.preventDefault();
      playback.toggleSolo(props.partIndex);
    };

    const toggleMute: JSXInternal.GenericEventHandler<HTMLElement> = (event) => {
      event.preventDefault();
      playback.toggleMute(props.partIndex);
    };

    const partNameChanged = (_event: FocusEvent) => {
      if (nameElementRef.current) {
        const newPartName = nameElementRef.current.innerText.trim().replaceAll(/\n\r\t/g, " ");
        application.dispatch(new ChangePartName(part, newPartName));
      }
    };

    return (
      <>
        <div className={`sticky left-0 flex gap-px pr-px ${rowBackgroundColor}`} {...contextMenuHandlers}>
          <div
            ref={nameElementRef}
            className="flex flex-1 cursor-text items-center px-4 text-xs font-extralight shadow-black text-shadow"
            onClick={onChange}
            onBlur={partNameChanged}
            data-part={partIndex}
            // This is the only way to avoid weird artifacts with the "contentEditable" attribute
            dangerouslySetInnerHTML={{ __html: part.name }}
            contentEditable
          />
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
