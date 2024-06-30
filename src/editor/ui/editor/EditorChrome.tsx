import { PauseIcon, PlayIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import type { PropsWithChildren } from "preact/compat";
import { useEffect } from "preact/hooks";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import * as notation from "../../../notation";
import { TogglePlayback } from "../../actions/playback/TogglePlayback";
import { Command } from "../../state/Application";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Loading } from "../misc/Loading";
import { Menu } from "../misc/Menu";
import { PopoverMenu } from "../misc/PopoverMenu";
import { Tooltip } from "../misc/Tooltip";
import { BendEditor } from "./bend-editor/BendEditor";
import { DebugPanel } from "./DebugPanel";
import { PartPanel } from "./part-panel/PartPanel";
import { Score } from "./Score";
import { SelectionPalette } from "./selection-palette/SelectionPalette";
import { TimeSignatureEditor } from "./time-signature-editor/TimeSignatureEditor";
import { EditTimeSignature } from "../../actions/editing/measure/EditTimeSignature";
import { AddPart } from "../../actions/editing/part/AddPart";
import { RemovePart } from "../../actions/editing/part/RemovePart";

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
    return <Loading />;
  }

  const EditorComponent = application.isSmallScreen ? SmallScreenView : RegularScreenView;

  return (
    <EditorComponent>
      <Score />
      <MuzartContextMenu />
      <BendEditor />
      <TimeSignatureEditor />
      <Tooltip />
      <ToolbarOverlayForSmallScreens />
    </EditorComponent>
  );
});

const SmallScreenView = observer((props: PropsWithChildren) => {
  return <>{props.children}</>;
});

const RegularScreenView = observer((props: PropsWithChildren) => {
  const application = useApplicationState();

  return (
    <div className="chrome relative grid h-screen max-h-screen w-screen max-w-screen gap-px bg-gray-950 fill-gray-200 text-gray-200">
      <PanelGroup autoSaveId="muzart-chrome" direction="vertical">
        <Panel defaultSize={80} minSize={10}>
          <PanelGroup autoSaveId="muzart-chrome-inner" direction="horizontal">
            <Panel order={1} defaultSize={20}>
              <SelectionPalette />
            </Panel>
            <PanelResizeHandle hitAreaMargins={{ coarse: 0, fine: 0 }} />
            <Panel order={2} minSize={10}>
              {props.children}
            </Panel>
            {application.debug.enabled && (
              <>
                <PanelResizeHandle hitAreaMargins={{ coarse: 0, fine: 0 }} />
                <Panel order={3} defaultSize={20}>
                  <DebugPanel />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>
        <PanelResizeHandle hitAreaMargins={{ coarse: 0, fine: 0 }} />
        <Panel order={4}>
          <PartPanel />
        </Panel>
      </PanelGroup>
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
    "pl-1.2 right-2 top-2 max-h-12 max-w-12 overflow-hidden rounded-full py-1 pr-0.8 shadow-modal hover:cursor-pointer pointer-events-auto",
    props.on ? "text-white hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100",
    props.on ? "bg-gray-700" : "bg-white",
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
    items = [AddPart, RemovePart];
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
