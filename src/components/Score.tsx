import React from "react";
import { layout } from "../layout/layout";
import { Score } from "../notation";
import { Suspenseful } from "../suspenseful";
import Page from "./Page";

export default function Score(props: { score: Score | Suspenseful<Score> }) {
  // TODO eventually we'll be able to switch between them
  const partIndex = 0;

  const score = "read" in props.score ? props.score.read() : props.score;

  const scoreLayout = layout(score);

  /*
  return (
    <>
      {score.title && <h1 className="text-center text-6xl font-serif mb-4">{score.title}</h1>}
      {score.composer && <div className="text-right text-xl font-serif mb-24">Composed by {score.composer}</div>}
      {score.parts[partIndex] && <MeasureRow measures={score.parts[partIndex].measures} />}
    </>
  );
  */
  return (
    <div className="flex flex-col items-center space-y-4">
      {scoreLayout.pages.map((page, index) => (
        <Page key={index} page={page} className="relative" />
      ))}
    </div>
  );
}
