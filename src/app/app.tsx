import { assign } from "lodash";
import * as React from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { determineType, load, ScoreDataType } from "../loaders";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
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
      <Suspense fallback={<Loading />}>
        <ErrorBoundary>{score && <ScoreWithContexts score={score} />}</ErrorBoundary>
      </Suspense>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center items-center w-screen h-screen text-slate-200">
      <div className="text-8xl">
        Loading
        <div className="animate-bounce inline-block" children="." />
        <div className="animate-bounce inline-block" style={{ animationDelay: "100ms" }} children="." />
        <div className="animate-bounce inline-block" style={{ animationDelay: "200ms" }} children="." />
      </div>
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
  return suspenseful(
    load(source).then((score) => {
      const start = performance.now();
      const scoreLayout = layout.layout(score);
      console.log(`Time to lay out full score: ${performance.now() - start}ms`);
      return scoreLayout;
    })
  );
}
