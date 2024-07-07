import {
  SpeakerXMarkIcon as MuteIcon,
  PlayCircleIcon,
  SpeakerWaveIcon as UnmuteIcon,
  PlayCircleIcon as UnsoloIcon,
} from "@heroicons/react/24/outline";
import { PlayCircleIcon as SoloIcon } from "@heroicons/react/24/solid";
import type { Part } from "@muzart/notation";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import type { ChangeEvent } from "preact/compat";
import { useRef } from "preact/hooks";
import type { JSXInternal } from "preact/src/jsx";
import { ChangePartName } from "../../../actions/editing/part/ChangePartName";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import { useMuzartContextMenu } from "../useMuzartContextMenu";

export const PartListingRow = observer((props: { part: Part }) => {
  const { selection, playback } = useApplicationState();
  const partIndex = selection.score?.score.parts.indexOf(props.part);
  if (partIndex === undefined) {
    throw new Error("Part not found in score");
  }

  const rowBackgroundColor = props.part === selection.part?.part ? "bg-gray-700" : "bg-gray-800";
  const contextMenuHandlers = useMuzartContextMenu(props.part);
  const application = useApplicationState();
  const nameElementRef = useRef<HTMLDivElement>(null);

  const toggleSolo: JSXInternal.GenericEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    playback.toggleSolo(props.part);
  };

  const toggleMute: JSXInternal.GenericEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    playback.toggleMute(props.part);
  };

  const partNameChanged = (_event: FocusEvent) => {
    if (nameElementRef.current) {
      const newPartName = nameElementRef.current.innerText.trim().replaceAll(/\n\r\t/g, " ");
      application.dispatch(new ChangePartName(props.part, newPartName));
    }
  };

  const onChange = (event: ChangeEvent<HTMLElement>) => {
    const part = event.currentTarget.dataset.part;
    const measure = event.currentTarget.dataset.measure;
    selection.update({
      partIndex: part ? parseInt(part) : undefined,
      measureIndex: measure ? parseInt(measure) : undefined,
    });
  };

  return (
    <div className={clsx("contents", rowBackgroundColor)} {...contextMenuHandlers}>
      <div className="bg-inherit">
        <PlayCircleIcon className="text-gray-500" />
      </div>
      <div
        ref={nameElementRef}
        className="text-shadow flex flex-1 cursor-text items-center bg-inherit px-4 text-xs font-extralight shadow-black"
        onClick={onChange}
        onBlur={partNameChanged}
        data-part={partIndex}
        // This is the only way to avoid weird artifacts with the "contentEditable" attribute
        dangerouslySetInnerHTML={{ __html: props.part.name }}
        contentEditable
      />
      <button
        type="button"
        name="solo"
        onClick={toggleSolo}
        className="flex items-center justify-center bg-inherit p-0.5"
      >
        {playback.soloedParts[partIndex] ? (
          <UnsoloIcon className="text-white hover:text-gray-400" title="Play other tracks" />
        ) : (
          <SoloIcon className="text-gray-500 hover:text-gray-300" title="Only play this track" />
        )}
      </button>
      <button
        type="button"
        name="mute"
        onClick={toggleMute}
        className="flex items-center justify-center rounded-r bg-inherit p-0.5"
      >
        {playback.mutedParts[partIndex] ? (
          <UnmuteIcon className="text-white hover:text-gray-400" title="Unmute this track" />
        ) : (
          <MuteIcon className="text-gray-500 hover:text-gray-300" title="Mute this track" />
        )}
      </button>
    </div>
  );
});
