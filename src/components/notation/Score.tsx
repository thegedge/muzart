import { assign } from "lodash";
import React, { useEffect, useState } from "react";
import * as layout from "../../layout";
import { Suspenseful } from "../../suspenseful";
import Page from "../layout/Page";
import { Toolbox } from "../ui/Toolbox";
import { DebugContext, DebugContextData } from "../utils/DebugContext";

export default function Score(props: { score: layout.Score | Suspenseful<layout.Score>; partIndex?: number }) {
  if (props.score == null) {
    return <></>;
  }

  const score = "read" in props.score ? props.score.read() : props.score;
  if (score == null) {
    return <></>;
  }

  const [debugData, setDebugData] = useState<DebugContextData>({
    enabled: false,
    index: 0,
    colorMap: {},
  });

  const [part, setPart] = useState(score.parts[props.partIndex || 0]);
  useEffect(() => {
    setPart(score.parts[props.partIndex || 0]);
  }, [score, props.partIndex]);

  return (
    <>
      <Toolbox
        score={score.score}
        onPartChange={(index) => setPart(score.parts[index])}
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
