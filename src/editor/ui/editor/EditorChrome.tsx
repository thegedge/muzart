import { observer } from "mobx-react-lite";
import { useEffect } from "preact/hooks";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Score } from "../misc/Score";
import { PartPanel } from "./PartPanel";

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
    <div className="chrome grid h-screen max-h-screen w-screen max-w-screen">
      <Score />
      <PartPanel />
    </div>
  );
});
