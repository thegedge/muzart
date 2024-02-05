import { PauseIcon, PlayIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { useEffect } from "preact/hooks";
import * as notation from "../../../notation";
import { EditTimeSignature } from "../../actions/editing/EditTimeSignature";
import { RemovePart } from "../../actions/editing/RemovePart";
import { TogglePlayback } from "../../actions/playback/TogglePlayback";
import { Command } from "../../state/Application";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Menu } from "../misc/Menu";
import { PopoverMenu } from "../misc/PopoverMenu";
import { Tooltip } from "../misc/Tooltip";
import { BendEditor } from "./BendEditor";
import { DebugPanel } from "./DebugPanel";
import { PartPanel } from "./PartPanel";
import { Score } from "./Score";
import { SelectionPalette } from "./SelectionPalette";
import { TimeSignatureEditor } from "./TimeSignatureEditor";

export const EditorChrome = observer((props: { loaderUrl: string }) => {
  const { loaderUrl: url } = props;
  const application = useApplicationState();

  useEffect(() => {
    application.loadScore(url).catch(console.error);
  }, [application, url]);

  if (application.error) {
    throw application.error;
  }

  if (application.loading) {
    return null;
  }

  return (
    <div className="chrome relative grid h-screen max-h-screen w-screen max-w-screen gap-px bg-gray-950 fill-gray-200 text-gray-200">
      <Score />
      <SelectionPalette />
      <PartPanel />
      <DebugPanel />

      {/* Overlays, menus, and various things that may or may not show based on the UI state */}
      <MuzartContextMenu />
      <BendEditor />
      <TimeSignatureEditor />
      <Tooltip />

      {/* Overlays for small screens */}
      <ToolbarOverlayForSmallScreens />
    </div>
  );
});

type IconType = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
    title?: string;
    titleId?: string;
  } & React.RefAttributes<SVGSVGElement>
>;

const ToolbarOverlayForSmallScreens = observer((_props: Record<string, never>) => {
  const application = useApplicationState();

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-0 flex flex-col items-end p-4 lg:hidden">
      <ToggleIconButton
        on={application.playback.playing}
        onIcon={PauseIcon}
        offIcon={PlayIcon}
        onCommand={TogglePlayback}
        offCommand={TogglePlayback}
      />
    </div>
  );
});

const ToggleIconButton = (props: {
  on: boolean;
  onIcon: IconType;
  offIcon: IconType;
  onCommand: Command;
  offCommand: Command;
}) => {
  const application = useApplicationState();
  const className = clsx(
    "pl-1.2 right-2 top-2 max-h-8 max-w-8 overflow-hidden rounded-full py-1 pr-0.8 shadow-modal hover:cursor-pointer",
    props.on ? "text-gray-white bg-gray-800 hover:bg-gray-700" : "text-gray-800 bg-white hover:bg-gray-100",
  );
  return (
    <div className={className}>
      {props.on ? (
        <props.onIcon
          className="h-full w-full"
          onClick={() => {
            application.dispatch(props.offCommand);
          }}
        />
      ) : (
        <props.offIcon
          className="h-full w-full"
          onClick={() => {
            application.dispatch(props.onCommand);
          }}
        />
      )}
    </div>
  );
};

const MuzartContextMenu = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const state = application.state;

  if (state.contextMenuSubject === null) {
    return null;
  }

  let items: Command[];
  if (state.contextMenuSubject instanceof notation.Part) {
    items = [RemovePart];
  } else if (state.contextMenuSubject instanceof notation.Measure) {
    items = [EditTimeSignature];
  } else {
    return null;
  }

  return (
    <PopoverMenu offsetX={state.contextMenuX} offsetY={state.contextMenuY} onHideMenu={() => state.hideContextMenu()}>
      <Menu>{items}</Menu>
    </PopoverMenu>
  );
});
