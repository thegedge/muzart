import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { createKeybindingsHandler } from "tinykeys";
import { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT, toAncestorCoordinateSystem } from "../../../layout";
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

  // TODO Playback of note when clicking

  const render: RenderFunction = (context, viewport) => {
    ScoreElement(application, context, part, viewport);

    if (application.playback.playing) {
      // TODO Playback box
    } else if (selection.chord) {
      // Selection box
      const PADDING = 3 * LINE_STROKE_WIDTH;
      const chordBox = toAncestorCoordinateSystem(selection.chord);
      const selectionBox = chordBox
        .update({
          y: chordBox.y + selection.noteIndex * STAFF_LINE_HEIGHT,
          width: selection.chord.type == "Chord" ? chordBox.width : STAFF_LINE_HEIGHT,
          height: STAFF_LINE_HEIGHT,
        })
        .expand(PADDING);

      context.fillStyle = "#f0f0a055";
      context.strokeStyle = "#a0a050";
      context.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      context.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
    }
  };

  return <Canvas render={render} size={part.box} />;
});
