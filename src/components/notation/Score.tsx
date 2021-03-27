import { assign } from "lodash";
import React, { useState } from "react";
import { layout } from "../../layout/layout";
import { Score } from "../../notation";
import { Suspenseful } from "../../suspenseful";
import Page from "../layout/Page";
import { Toolbox } from "../ui/Toolbox";
import { DebugContext, DebugContextData } from "../utils/DebugContext";

export default function Score(props: { score: Score | Suspenseful<Score>; partIndex?: number }) {
  if (props.score == null) {
    return <></>;
  }

  const score = "read" in props.score ? props.score.read() : props.score;
  if (score == null) {
    return <></>;
  }

  const now = performance.now();
  const scoreLayout = layout(score);
  (window as any).scoreLayout = scoreLayout;
  console.log({ scoreLayout });
  console.log(`Time to lay out: ${performance.now() - now}ms`);

  const [debugData, setDebugData] = useState<DebugContextData>({
    enabled: false,
    index: 0,
    colorMap: {},
  });

  const [part, setPart] = useState(scoreLayout.parts[props.partIndex || 0]);
  return (
    <>
      <Toolbox
        score={score}
        onPartChange={(index) => setPart(scoreLayout.parts[index])}
        onDebugToggled={(v) => {
          const value = assign({}, debugData, { enabled: v });
          console.log(value);
          setDebugData(value);
        }}
      />
      <DebugContext.Provider value={debugData}>
        <div className="flex flex-row flex-wrap items-center justify-center">
          {part.pages.map((page, index) => (
            <Page key={index} page={page} />
          ))}
        </div>
      </DebugContext.Provider>
    </>
  );
}
