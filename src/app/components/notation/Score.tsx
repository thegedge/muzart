import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { createKeybindingsHandler } from "tinykeys";
import { PageCallout } from "../layout/PageCallout";
import { Loading } from "../ui/Loading";
import { useApplicationState } from "../utils/ApplicationStateContext";
import { Part } from "./Part";

export const Score = observer(function Score() {
  const { score, loading, error, selection, playback } = useApplicationState();

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

  if (loading) {
    return <Loading />;
  }

  if (error) {
    throw error; // Let the ErrorBoundary figure it out
  }

  if (score == null) {
    return <PageCallout>Drop a Guitar Pro 4 file here</PageCallout>;
  }

  if (!selection.part) {
    return null;
  }

  return <Part part={selection.part} />;
});
