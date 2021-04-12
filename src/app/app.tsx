import * as React from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { determineType, load, ScoreDataType } from "../loaders";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Score from "./components/notation/Score";
import { PlaybackContext } from "./components/utils/PlaybackContext";
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
    <PlaybackContext>
      <div className="bg-gray-400 py-4 min-h-screen" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
        <Suspense fallback={<h1>Loading...</h1>}>
          {score && (
            <ErrorBoundary>
              <Score score={score} />
            </ErrorBoundary>
          )}
        </Suspense>
      </div>
    </PlaybackContext>
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
