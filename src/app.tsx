import * as React from "react";
import { useEffect, useState } from "react";
import "./app.css";
import ScoreComponent from "./components/Score";
import loadMusicXml from "./loaders/musicxml";
import { Score } from "./notation";

export default function App() {
  const [score, setScore] = useState<Score>();

  useEffect(() => {
    fetch("example2.xml").then((response) => {
      response.text().then((value) => {
        try {
          setScore(loadMusicXml(value));
        } catch (e) {
          setScore({ title: e.message, parts: [] });
        }
      });
    });
  }, []);

  return <ScoreComponent score={score} />;
}
