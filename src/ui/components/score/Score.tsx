import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { createKeybindingsHandler } from "tinykeys";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Canvas, RenderFunction } from "../misc/Canvas";
import { ScoreElement } from "./ScoreElement";

export const Score = observer((_props: never) => {
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

  const part = selection.part;
  if (!part) {
    return null;
  }

  // TODO bring back three things:
  //   1. Selection box
  //   2. Playback box
  //   3. Playback of note when clicking

  const render: RenderFunction = (context, viewport) => {
    ScoreElement(application, context, part, viewport);
  };

  return <Canvas render={render} size={part.box} />;
});
