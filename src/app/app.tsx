import { assign } from "lodash";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { determineType, ScoreDataType } from "../loaders";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageCallout } from "./components/layout/PageCallout";
import { Score } from "./components/notation/Score";
import { Toolbox } from "./components/ui/Toolbox";
import { ApplicationState, useApplicationState } from "./components/utils/ApplicationStateContext";
import { DebugContext, DebugContextData } from "./components/utils/DebugContext";
import { PlaybackContext } from "./components/utils/PlaybackContext";

export default function App() {
  return (
    <ApplicationState>
      <PlaybackContext>
        <ScoreDropZone />
      </PlaybackContext>
    </ApplicationState>
  );
}

const ScoreDropZone = observer(function ScoreDropZone(props: {}) {
  const application = useApplicationState();

  useEffect(() => {
    if (process.env.DEFAULT_FILE) {
      void application.loadScore(process.env.DEFAULT_FILE);
    }
  }, [application]);

  const onDrop = useCallback(
    (event: React.DragEvent<Element>) => {
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
    },
    [application]
  );

  return (
    <div className="bg-gray-400 min-h-screen min-w-max" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
      <ErrorBoundary>
        <ScoreWithToolbox />
      </ErrorBoundary>
    </div>
  );
});

function Loading() {
  return (
    <PageCallout>
      Loading
      <BouncingDot delayMS={100} />
      <BouncingDot delayMS={200} />
      <BouncingDot delayMS={300} />
    </PageCallout>
  );
}

function BouncingDot(props: { delayMS: number }) {
  return (
    <div className="animate-bounce -translate-y-1/4 inline-block" style={{ animationDelay: `${props.delayMS}ms` }}>
      .
    </div>
  );
}

const ScoreWithToolbox = observer(function ScoreWithToolbox(props: {}) {
  const application = useApplicationState();

  const [debugData, setDebugData] = useState<DebugContextData>({
    enabled: false,
    index: 0,
    colorMap: {},
  });

  const score = application.score;
  if (score == null) {
    if (application.error) {
      throw application.error;
    } else if (application.loading) {
      return <Loading />;
    }
    return <PageCallout>Drop a Guitar Pro 4 file here</PageCallout>;
  }

  return (
    <DebugContext.Provider value={debugData}>
      <Toolbox
        score={score.score}
        onDebugToggled={(v) => {
          const value = assign({}, debugData, { enabled: v });
          setDebugData(value);
        }}
      />
      <Score score={score} />
    </DebugContext.Provider>
  );
});
