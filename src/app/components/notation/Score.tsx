import React, { useEffect } from "react";
import * as layout from "../../layout";
import { usePlayback } from "../utils/PlaybackContext";
import { useReadSelection } from "../utils/SelectionContext";
import { Part } from "./Part";

export function Score(props: { score: layout.Score }) {
  const selection = useReadSelection();
  const part = props.score.parts[selection.part];

  const playback = usePlayback();
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
}
