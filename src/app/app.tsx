import { assign } from "lodash";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { useEffect, useState } from "react";
import { determineType, ScoreDataType } from "../loaders";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageCallout } from "./components/layout/PageCallout";
import { Score } from "./components/notation/Score";
import { Loading } from "./components/ui/Loading";
import { Toolbox } from "./components/ui/Toolbox";
import { ApplicationState, useApplicationState } from "./components/utils/ApplicationStateContext";
import { DebugContext, DebugContextData } from "./components/utils/DebugContext";

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
      <ScoreWithToolbox />
    </div>
  );
};

const ScoreWithToolbox = observer(function ScoreWithToolbox() {
  // TODO move to application state
  const [debugData, setDebugData] = useState<DebugContextData>({
    enabled: false,
    index: 0,
    colorMap: {},
  });

  const { score, error, loading } = useApplicationState();
  if (loading) {
    return <Loading />;
  }

  if (error) {
    throw error; // Let the ErrorBoundary figure it out
  }

  if (score == null) {
    return <PageCallout>Drop a Guitar Pro 4 file here</PageCallout>;
  }

  return (
    <DebugContext.Provider value={debugData}>
      <Toolbox
        onDebugToggled={(v) => {
          const value = assign({}, debugData, { enabled: v });
          setDebugData(value);
        }}
      />
      <Score />
    </DebugContext.Provider>
  );
});
