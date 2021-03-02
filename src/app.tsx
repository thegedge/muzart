import * as React from "react";
import "./app.css";
import ScoreComponent from "./components/Score";
import { Score } from "./notation";

export default function App() {
  const testScore: Score = {
    title: "Sweet Child O' Mine",
    parts: [
      {
        measures: [
          {
            chords: [
              { fret: 12, string: 4 },
              { fret: 15, string: 2 },
              { fret: 14, string: 3 },
              { fret: 12, string: 3 },
              { fret: 15, string: 1 },
              { fret: 14, string: 3 },
              { fret: 14, string: 1 },
              { fret: 14, string: 3 },
            ],
          },
        ],
      },
    ],
  };

  return <ScoreComponent score={testScore} />;
}
