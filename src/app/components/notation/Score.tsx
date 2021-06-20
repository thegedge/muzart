import { assign } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import * as layout from "../../layout";
import { Suspenseful } from "../../suspenseful";
import { Toolbox } from "../ui/Toolbox";
import { DebugContext, DebugContextData } from "../utils/DebugContext";
import { usePlayback } from "../utils/PlaybackContext";
import { useReadSelection } from "../utils/SelectionContext";
import { Part } from "./Part";

export function Score(props: { score: layout.Score | Suspenseful<layout.Score> }) {
  if (props.score == null) {
    return <></>;
  }

  const score = "read" in props.score ? props.score.read() : props.score;
  if (score == null) {
    return <></>;
  }

  const { part: selectedPart } = useReadSelection();
  const part = score.parts[selectedPart];

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
        onDebugToggled={(v) => {
          const value = assign({}, debugData, { enabled: v });
          setDebugData(value);
        }}
      />
      <DebugContext.Provider value={debugData}>
        <Part part={part} />
      </DebugContext.Provider>
    </>
  );
}
