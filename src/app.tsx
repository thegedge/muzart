import * as React from "react";
import { Suspense } from "react";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Score from "./components/Score";
import { determineType, load, ScoreDataType } from "./loaders";
import { suspenseful } from "./suspenseful";

export default function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [score, setScore] = React.useState(suspenseful(load("example.xml").finally(() => setIsLoading(false))));

  return (
    <div
      className="bg-gray-400 p-24 min-h-screen"
      onDrop={(event) => {
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
      }}
      onDragOver={(event) => event.preventDefault()}
    >
      <Suspense fallback={<h1>Loading...</h1>}>
        <ErrorBoundary>
          <Score score={score} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}