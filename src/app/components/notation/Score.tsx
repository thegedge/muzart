import { assign } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import * as layout from "../../layout";
import { Suspenseful } from "../../suspenseful";
import Page from "../layout/Page";
import { Toolbox } from "../ui/Toolbox";
import { DebugContext, DebugContextData } from "../utils/DebugContext";
import { usePlayback } from "../utils/PlaybackContext";

export default function Score(props: { score: layout.Score | Suspenseful<layout.Score>; partIndex?: number }) {
  if (props.score == null) {
    return <></>;
  }

  const score = "read" in props.score ? props.score.read() : props.score;
  if (score == null) {
    return <></>;
  }

  // TODO || 2 for sweet child o mine, but eventually make it 0
  const [part, setPart] = useState(score.parts[props.partIndex || 2]);
  useEffect(() => {
    setPart(score.parts[props.partIndex || 2]);
  }, [score, props.partIndex]);

  const playback = usePlayback();
  const onKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        playback.togglePlay(part.part);
      }
    },
    [part]
  );

  useEffect(() => {
    playback.stop();

    // TODO find a way to not have to do this, perhaps some hotkeys library
    document.body.onkeypress = onKeyPress;
  }, [part]);

  const [debugData, setDebugData] = useState<DebugContextData>({
    enabled: false,
    index: 0,
    colorMap: {},
  });

  return (
    <>
      <Toolbox
        score={score.score}
        onPartChange={(index) => setPart(score.parts[index])}
        onDebugToggled={(v) => {
          const value = assign({}, debugData, { enabled: v });
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
