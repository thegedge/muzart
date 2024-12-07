import { PercussionInstrument, StringInstrument, type Part } from "@muzart/notation";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import type { FocusEventHandler, MouseEventHandler, ReactEventHandler } from "react";
import { useRef } from "react";

import { ChangePartName } from "../../../actions/editing/part/ChangePartName";
import { useApplicationState } from "../../../utils/ApplicationStateContext";
import {
  BassHeadIcon,
  DrumIcon,
  GuitarHeadIcon,
  MusicNoteIcon,
  MuteIcon,
  PianoIcon,
  SoloIcon,
  UnmuteIcon,
  UnsoloIcon,
  VocalistIcon,
  type IconType,
} from "../../icons";
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

  const toggleSolo: ReactEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    playback.toggleSolo(props.part);
  };

  const toggleMute: ReactEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    playback.toggleMute(props.part);
  };

  const partNameChanged: FocusEventHandler = () => {
    if (nameElementRef.current) {
      const newPartName = nameElementRef.current.innerText.trim().replaceAll(/\n\r\t/g, " ");
      application.dispatch(new ChangePartName(props.part, newPartName));
    }
  };

  const onChange: MouseEventHandler<HTMLDivElement> = (event) => {
    const part = event.currentTarget.dataset.part;
    const measure = event.currentTarget.dataset.measure;
    selection.update({
      partIndex: part ? parseInt(part) : undefined,
      measureIndex: measure ? parseInt(measure) : undefined,
    });
  };

  let InstrumentIcon: IconType;
  if (props.part.instrument instanceof StringInstrument) {
    // TODO perhaps guess from midiPreset instead of what we're doing
    if (props.part.instrument.tuning.length >= 6) {
      const partName = props.part.name.toLowerCase();
      if (partName.includes("vocal") || partName.includes("voice")) {
        InstrumentIcon = VocalistIcon;
      } else if (partName.includes("piano")) {
        InstrumentIcon = PianoIcon;
      } else {
        InstrumentIcon = GuitarHeadIcon;
      }
    } else if (props.part.instrument.tuning.length === 4) {
      InstrumentIcon = BassHeadIcon;
    }
  } else if (props.part.instrument instanceof PercussionInstrument) {
    InstrumentIcon = DrumIcon;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  InstrumentIcon ??= MusicNoteIcon;

  return (
    <div className={clsx("contents", rowBackgroundColor)} {...contextMenuHandlers}>
      <div className="flex w-8 items-center justify-center bg-inherit p-1">
        <InstrumentIcon size="100%" className="text-gray-400" />
      </div>
      <div
        ref={nameElementRef}
        className="text-shadow flex cursor-text items-center bg-inherit px-2 text-xs font-extralight shadow-black"
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
        className="flex items-center justify-center bg-inherit p-1"
      >
        {playback.soloedParts[partIndex] ? (
          <UnsoloIcon size="100%" className="text-white hover:text-gray-400" title="Play other tracks" />
        ) : (
          <SoloIcon size="100%" className="text-gray-500 hover:text-gray-300" title="Only play this track" />
        )}
      </button>
      <button
        type="button"
        name="mute"
        onClick={toggleMute}
        className="flex items-center justify-center rounded-r bg-inherit p-1"
      >
        {playback.mutedParts[partIndex] ? (
          <UnmuteIcon size="100%" className="text-white hover:text-gray-400" title="Unmute this track" />
        ) : (
          <MuteIcon size="100%" className="text-gray-500 hover:text-gray-300" title="Mute this track" />
        )}
      </button>
    </div>
  );
});
