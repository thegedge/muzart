import * as React from "react";
import { useEffect } from "react";
import { determineScoreType, getFilenameAndMimeType, ScoreDataType } from "../loaders";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { Score } from "./components/notation/Score";
import { Toolbox } from "./components/ui/Toolbox";
import { ApplicationState, useApplicationState } from "./components/utils/ApplicationStateContext";

export default function App() {
  return (
    <div className="bg-gray-400 min-h-screen min-w-max">
      <div className="github-fork">
        <a href="https://github.com/thegedge/muzart" className="underline">
          <svg viewBox="0 0 17 17" version="1.1" width="48" height="48">
            <path
              fillRule="evenodd"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            ></path>
          </svg>
        </a>
      </div>
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

    if (process.env.DEFAULT_SOUNDFONT) {
      void application.playback.loadSoundFont(process.env.DEFAULT_SOUNDFONT);
    }
  }, [application]);

  const onDrop = (event: React.DragEvent<Element>) => {
    event.preventDefault();

    const sources: File[] = [];
    if (event.dataTransfer.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if (event.dataTransfer.items[i].kind === "file") {
          const file = event.dataTransfer.items[i].getAsFile();
          if (file) {
            sources.push(file);
          }
        }
      }
    } else {
      for (let i = 0; i < event.dataTransfer.files.length; i++) {
        const file = event.dataTransfer.files[i];
        sources.push(file);
      }
    }

    const soundfontFile = sources.find((file) => getFilenameAndMimeType(file).filename.endsWith(".sf2"));
    const tabFile = sources.find((file) => determineScoreType(file) != ScoreDataType.Unknown);

    if (soundfontFile) {
      void application.playback.loadSoundFont(soundfontFile);
    }

    if (tabFile) {
      void application.loadScore(tabFile);
    }
  };

  return (
    <div
      className="min-w-screen min-h-screen"
      onDrop={onDrop}
      onDragOver={(e) => {
        console.info("dragging");
        e.preventDefault();
      }}
    >
      <Toolbox />
      <Score />
    </div>
  );
};
