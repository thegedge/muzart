import { assign } from "lodash";
import * as React from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { determineType, load, ScoreDataType } from "../loaders";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageCallout } from "./components/layout/PageCallout";
import { Score } from "./components/notation/Score";
import { Toolbox } from "./components/ui/Toolbox";
import { DebugContext, DebugContextData } from "./components/utils/DebugContext";
import { PlaybackContext } from "./components/utils/PlaybackContext";
import { SelectionContext } from "./components/utils/SelectionContext";
import * as layout from "./layout";
import { Suspenseful, suspenseful } from "./suspenseful";

export default function App() {
  const [score, setScore] = useState<Suspenseful<layout.Score>>();

  useEffect(() => {
    if (process.env.DEFAULT_FILE) {
      setScore(loadScore(process.env.DEFAULT_FILE));
    }
  }, []);

  const onDrop = useCallback((event: React.DragEvent<Element>) => {
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
      setScore(loadScore(file));
    }
  }, []);

  return (
    <div className="bg-gray-400 min-h-screen min-w-max" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
      {score ? (
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <ScoreWithContexts score={score} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <PageCallout>Drop a Guitar Pro 4 file here</PageCallout>
      )}
    </div>
  );
}

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

function ScoreWithContexts(props: { score: Suspenseful<layout.Score> }) {
  if (props.score == null) {
    return <></>;
  }

  const score = props.score.read();
  if (score == null) {
    return <></>;
  }

  const [debugData, setDebugData] = useState<DebugContextData>({
    enabled: false,
    index: 0,
    colorMap: {},
  });

  return (
    <DebugContext.Provider value={debugData}>
      <PlaybackContext>
        <SelectionContext score={score}>
          <Toolbox
            score={score.score}
            onDebugToggled={(v) => {
              const value = assign({}, debugData, { enabled: v });
              setDebugData(value);
            }}
          />
          <Score score={score} />
        </SelectionContext>
      </PlaybackContext>
    </DebugContext.Provider>
  );
}

function loadScore(source: string | File | URL) {
  return suspenseful(async () => {
    const score = await load(source);
    return layout.layout(score);
  });
}
