import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import * as layout from "../../layout";
import { useApplicationState } from "../utils/ApplicationStateContext";
import { Part } from "./Part";

export const Score = observer(function Score(props: { score: layout.Score }) {
  const { selection } = useApplicationState();
  const part = props.score.parts[selection.part];

  const { playback } = useApplicationState();
  const onKeyPress = (event: KeyboardEvent) => {
    if (event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      playback.togglePlay(part.part, selection);
    }
  };

  useEffect(() => {
    playback.stop();

    // TODO find a way to not have to do this, perhaps some hotkeys library
    document.body.onkeypress = onKeyPress;
  }, [playback, onKeyPress]);

  return <Part part={part} />;
});
