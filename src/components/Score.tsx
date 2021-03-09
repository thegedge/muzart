import React from "react";
import { layout } from "../layout/layout";
import { Score } from "../notation";
import { Suspenseful } from "../suspenseful";
import Page from "./Page";

export default function Score(props: { score: Score | Suspenseful<Score> }) {
  const score = "read" in props.score ? props.score.read() : props.score;
  const scoreLayout = layout(score);
  return (
    <div className="flex flex-col items-center space-y-4">
      {scoreLayout.pages.map((page, index) => (
        <Page key={index} page={page} />
      ))}
    </div>
  );
}
