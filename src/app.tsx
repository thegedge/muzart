import * as React from "react";
import { Suspense } from "react";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Score from "./components/notation/Score";
import { determineType, load, ScoreDataType } from "./loaders";
import * as notation from "./notation";
import { Suspenseful, suspenseful } from "./suspenseful";

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [score, setScore] = React.useState<Suspenseful<notation.Score | null>>();

  React.useEffect(() => {
    if (process.env.DEFAULT_FILE) {
      setScore(suspenseful(load(process.env.DEFAULT_FILE).finally(() => setIsLoading(false))));
    }
  }, []);

  const onDrop = React.useCallback((event: React.DragEvent<Element>) => {
    if (!isLoading) {
      event.preventDefault();

      setIsLoading(true);

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
        setScore(suspenseful(load(file).finally(() => setIsLoading(false))));
      }
    }
  }, []);

  return (
    <div className="bg-gray-400 py-4 min-h-screen" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
      <Suspense fallback={<h1>Loading...</h1>}>
        {score && (
          <ErrorBoundary>
            <Score score={score} />
          </ErrorBoundary>
        )}
      </Suspense>
    </div>
  );
}
