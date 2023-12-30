import { observer } from "mobx-react-lite";
import { useEffect } from "preact/hooks";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Score } from "../misc/Score";
import { PartPanel } from "./PartPanel";
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
    </div>
  );
});
