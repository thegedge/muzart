import * as React from "react";
import { Suspense } from "react";
import "./app.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Score from "./components/Score";
import loadMusicXml from "./loaders/musicxml";
import suspenseful from "./suspenseful";

export default function App() {
  const score = suspenseful(
    fetch("example2.xml")
      .then((response) => response.text())
      .then((value) => loadMusicXml(value))
  );

  return (
    <div className="bg-gray-400 p-24 min-h-screen">
      <div className="mx-auto bg-white p-24 border-black border">
        <Suspense fallback={<h1>Loading...</h1>}>
          <ErrorBoundary>
            <Score score={score} />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
}
