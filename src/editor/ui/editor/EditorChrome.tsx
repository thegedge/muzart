import { observer } from "mobx-react-lite";
import { useEffect } from "preact/hooks";
import * as notation from "../../../notation";
import { RemovePart } from "../../actions/editing/RemovePart";
import { Command } from "../../state/Application";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Menu } from "../misc/Menu";
import { PopoverMenu } from "../misc/PopoverMenu";
import { PartPanel } from "./PartPanel";
import { Score } from "./Score";
import { SelectionPalette } from "./SelectionPalette";

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
    <div className="chrome grid h-screen max-h-screen w-screen max-w-screen gap-px bg-gray-950 fill-gray-200 text-gray-200">
      <Score />
      <SelectionPalette />
      <PartPanel />
      <MuzartContextMenu />
    </div>
  );
});

const MuzartContextMenu = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const state = application.state;

  if (state.contextMenuSubject === null) {
    return null;
  }

  let items: Command[] = [];
  if (state.contextMenuSubject instanceof notation.Part) {
    items = [RemovePart];
  } else {
    return null;
  }

  return (
    <PopoverMenu offsetX={state.contextMenuX} offsetY={state.contextMenuY} onHideMenu={() => state.hideContextMenu()}>
      <Menu>{items}</Menu>
    </PopoverMenu>
  );
});
