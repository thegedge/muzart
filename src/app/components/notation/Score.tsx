import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { createKeybindingsHandler } from "tinykeys";
import { useApplicationState } from "../utils/ApplicationStateContext";
import { Part } from "./Part";

export const Score = observer(function Score() {
  const { selection, playback } = useApplicationState();
  if (!selection.part) {
    return null;
  }

  useEffect(() => {
    return () => playback.stop();
  }, [playback]);

  useEffect(() => {
    const listener = createKeybindingsHandler({
      Space: (event) => {
        event.preventDefault();
        playback.togglePlay(selection);
      },
      ArrowLeft: (event) => {
        event.preventDefault();
        selection.previousChord();
      },
      ArrowRight: (event) => {
        event.preventDefault();
        selection.nextChord();
      },
      ArrowUp: (event) => {
        event.preventDefault();
        selection.previousNote();
      },
      ArrowDown: (event) => {
        event.preventDefault();
        selection.nextNote();
      },
    });

    document.body.addEventListener("keydown", listener);

    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [selection, playback]);

  return <Part part={selection.part} />;
});
