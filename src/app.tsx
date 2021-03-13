import * as React from "react";
import { Suspense } from "react";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Score from "./components/Score";
import loadMusicXml from "./loaders/musicxml";
import suspenseful from "./suspenseful";

export default function App() {
  const score = suspenseful(
    fetch("example.xml")
      .then((response) => response.text())
      .then((value) => {
        const now = performance.now();
        const score = loadMusicXml(value);
        console.log(`Time to parse MusicXML: ${performance.now() - now}ms`);
        return score;
      })
  );

  return (
    <div className="bg-gray-400 p-24 min-h-screen">
      <Suspense fallback={<h1>Loading...</h1>}>
        <ErrorBoundary>
          <Score score={score} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}
