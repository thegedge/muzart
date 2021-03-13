import React from "react";
import { layout } from "../layout/layout";
import { Score } from "../notation";
import { Suspenseful } from "../suspenseful";
import Page from "./Page";

export default function Score(props: { score: Score | Suspenseful<Score | null> | null }) {
  if (props.score == null) {
    return <></>;
  }

  const score = "read" in props.score ? props.score.read() : props.score;
  if (score == null) {
    return <></>;
  }

  const now = performance.now();
  const scoreLayout = layout(score);
  console.log(`Time to lay out: ${performance.now() - now}ms`);
  return (
    <div className="flex flex-col items-center space-y-4">
      {scoreLayout.pages.map((page, index) => (
        <Page key={index} page={page} />
      ))}
    </div>
  );
}
