import * as React from "react";
import { Suspense } from "react";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Score from "./components/Score";
import loadMusicXml from "./loaders/musicxml";
import * as notation from "./notation";
import suspenseful, { Suspenseful } from "./suspenseful";

export default function App() {
  const loadScore = (text: string) => {
    const now = performance.now();
    const score = loadMusicXml(text);
    console.log(`Time to parse MusicXML: ${performance.now() - now}ms`);
    setIsLoading(false);
    return score;
  };

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [score, setScore] = React.useState<Suspenseful<notation.Score>>(
    suspenseful(
      fetch("example.xml")
        .then((response) => response.text())
        .then(loadScore)
    )
  );

  return (
    <div
      className="bg-gray-400 p-24 min-h-screen"
      onDrop={(event) => {
        if (!isLoading) {
          event.preventDefault();
          if (event.dataTransfer.items) {
            for (let i = 0; i < event.dataTransfer.items.length; i++) {
              if (event.dataTransfer.items[i].kind === "file") {
                const file = event.dataTransfer.items[i].getAsFile();
                if (
                  file &&
                  (file.type == "application/xml" || file.name.endsWith(".xml") || file.name.endsWith(".musicxml"))
                ) {
                  setIsLoading(true);
                  setScore(suspenseful(file.text().then(loadScore)));
                  break;
                }
              }
            }
          } else {
            for (let i = 0; i < event.dataTransfer.files.length; i++) {
              const file = event.dataTransfer.files[i];
              if (
                file &&
                (file.type == "application/xml" || file.name.endsWith(".xml") || file.name.endsWith(".musicxml"))
              ) {
                setIsLoading(true);
                setScore(suspenseful(file.text().then(loadScore)));
                break;
              }
            }
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
