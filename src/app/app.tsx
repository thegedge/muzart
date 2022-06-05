import { assign } from "lodash";
import * as React from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { determineType, ScoreDataType } from "../loaders";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageCallout } from "./components/layout/PageCallout";
import { Score } from "./components/notation/Score";
import { Toolbox } from "./components/ui/Toolbox";
import { DebugContext, DebugContextData } from "./components/utils/DebugContext";
import { PlaybackContext } from "./components/utils/PlaybackContext";
import { SelectionContext } from "./components/utils/SelectionContext";
import * as layout from "./layout";
import { isWorkerResponseEvent, LoadEvent, __workerRequestEvent } from "./workers/layout/events";

const worker = new Worker(new URL("./workers/layout/main.ts", import.meta.url));

const loadScore = (source: string | URL | File | null | undefined) => {
  if (!source) {
    return;
  }

  worker.postMessage({
    __workerRequestEvent,
    type: "load",
    source: process.env.DEFAULT_FILE,
  } as LoadEvent);
};

export default function App() {
  const [score, setScore] = useState<layout.Score>();

  useEffect(() => {
    worker.onmessage = (event: MessageEvent<unknown>) => {
      if (!isWorkerResponseEvent(event)) {
        return;
      }

      switch (event.data.type) {
        case "loaded": {
          setScore(event.data.score);
          return;
        }
      }
    };

    return () => worker.terminate();
  }, [worker]);

  useEffect(() => {
    loadScore(process.env.DEFAULT_FILE);
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

    loadScore(file);
  }, []);

  return (
    <div className="bg-gray-400 min-h-screen min-w-max" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
      {score ? (
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <ScoreWithContexts scoreLayout={score} />
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

function ScoreWithContexts(props: { scoreLayout: layout.Score | null }) {
  if (props.scoreLayout == null) {
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
        <SelectionContext score={props.scoreLayout}>
          <Toolbox
            score={props.scoreLayout.score}
            onDebugToggled={(v) => {
              const value = assign({}, debugData, { enabled: v });
              setDebugData(value);
            }}
          />
          <Score score={props.scoreLayout} />
        </SelectionContext>
      </PlaybackContext>
    </DebugContext.Provider>
  );
}
