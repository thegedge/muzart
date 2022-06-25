import * as React from "react";
import { useEffect } from "react";
import { determineType, ScoreDataType } from "../loaders";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { Score } from "./components/notation/Score";
import { Toolbox } from "./components/ui/Toolbox";
import { ApplicationState, useApplicationState } from "./components/utils/ApplicationStateContext";

export default function App() {
  return (
    <div className="bg-gray-400 min-h-screen min-w-max">
      <ErrorBoundary>
        <ApplicationState>
          <ScoreDropZone />
        </ApplicationState>
      </ErrorBoundary>
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

  const onDrop = (event: React.DragEvent<Element>) => {
    event.preventDefault();

    let file: File | null = null;
    let type: ScoreDataType | undefined;
    if (event.dataTransfer.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if (event.dataTransfer.items[i].kind === "file") {
          file = event.dataTransfer.items[i].getAsFile();
          if (file) {
            type = determineType(file);
            if (type != ScoreDataType.Unknown) {
              break;
            }
          }
        }
      }
    } else {
      for (let i = 0; i < event.dataTransfer.files.length; i++) {
        file = event.dataTransfer.files[i];
        type = determineType(file);
        if (type != ScoreDataType.Unknown) {
          break;
        }
      }
    }

    if (file) {
      void application.loadScore(file);
    }
  };

  return (
    <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      <Toolbox />
      <Score />
    </div>
  );
};
