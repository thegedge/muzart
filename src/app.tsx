import * as React from "react";
import { useEffect, useState } from "react";
import "./app.css";
import ScoreComponent from "./components/Score";
import loadMusicXml from "./loaders/musicxml";
import { Score } from "./notation";

export default function App() {
  const [score, setScore] = useState<Score>();

  useEffect(() => {
    fetch("example.xml").then((response) => {
      response.text().then((value) => {
        console.log(loadMusicXml(value));
        setScore(loadMusicXml(value));
      });
    });
  }, []);

  return <ScoreComponent score={score} />;
}
