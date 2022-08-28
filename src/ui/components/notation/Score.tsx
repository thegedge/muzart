import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { createKeybindingsHandler } from "tinykeys";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { SvgRoot } from "../misc/SvgRoot";
import { Part } from "./Part";

export const Score = observer(() => {
  const application = useApplicationState();
  const { error, selection, playback, debug } = application;

  useEffect(() => {
    const listener = createKeybindingsHandler({
      "Space": (event) => {
        event.preventDefault();
        playback.togglePlay();
      },
      "ArrowLeft": (event) => {
        event.preventDefault();
        selection.previousChord();
      },
      "ArrowRight": (event) => {
        event.preventDefault();
        selection.nextChord();
      },
      "ArrowUp": (event) => {
        event.preventDefault();
        selection.previousNote();
      },
      "ArrowDown": (event) => {
        event.preventDefault();
        selection.nextNote();
      },
      "Shift+D": (event) => {
        event.preventDefault();
        debug.setEnabled(!debug.enabled);
      },
    });

    document.body.addEventListener("keydown", listener);
    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [selection, playback]);

  if (error) {
    throw error; // Let the ErrorBoundary figure it out
  }

  if (!selection.part) {
    return null;
  }

  return (
    <SvgRoot box={selection.part.box}>
      <Part part={selection.part} />
    </SvgRoot>
  );
});
