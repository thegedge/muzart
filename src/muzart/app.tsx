import * as React from "react";
import { useEffect } from "react";
import "./app.css";
import { Score } from "./components/notation/Score";
import { ApplicationState, useApplicationState } from "./components/state/ApplicationStateContext";
import { Toolbox } from "./components/ui/Toolbox";
import { useDragDropHelpers } from "./components/utils/useDragDropHelpers";

export default function App() {
  return (
    <div className="bg-gray-400 min-h-screen min-w-max">
      <div className="bg-gray-400 text-gray-100 opacity-80 fixed top-0 left-0 px-2 py-1">
        <a href="https://github.com/thegedge/muzart" className="underline">
          Source on GitHub
        </a>
      </div>
      <ApplicationState>
        <ScoreDropZone />
      </ApplicationState>
    </div>
  );
}

const ScoreDropZone = () => {
  const application = useApplicationState();

  useEffect(() => {
    if (process.env.DEFAULT_FILE) {
      void application.loadScore(process.env.DEFAULT_FILE);
    }
  }, [application]);

  const dragDropProps = useDragDropHelpers((file) => {
    void application.loadScore(file);
  });

  return (
    <div {...dragDropProps}>
      <Toolbox />
      <Score />
    </div>
  );
};
