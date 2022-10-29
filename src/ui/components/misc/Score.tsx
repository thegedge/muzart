import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "preact/hooks";
import { createKeybindingsHandler } from "tinykeys";
import { LINE_STROKE_WIDTH, STAFF_LINE_HEIGHT, toAncestorCoordinateSystem } from "../../../layout";
import { renderScoreElement } from "../../../render/renderScoreElement";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Canvas, Point, RenderFunction } from "../misc/Canvas";

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

  const render = useCallback<RenderFunction>(
    (context, viewport) => {
      renderScoreElement(application, context, part, viewport);

      if (application.playback.playing) {
        // Playback box
        const measure = application.playback.currentMeasure;
        if (measure) {
          const measureBox = toAncestorCoordinateSystem(measure);
          context.strokeStyle = "#ff000033";
          context.lineWidth = LINE_STROKE_WIDTH * 8;
          context.strokeRect(measureBox.x, measureBox.y, measureBox.width, measureBox.height);
        }
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
    },
    [
      application.selection.partIndex,
      application.selection.measureIndex,
      application.selection.chordIndex,
      application.selection.noteIndex,
      application.debug.enabled,
      application.playback.playing,
      application.playback.currentMeasure,
    ]
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onClick = (pt: Point) => {
    const hit = application.elementAtPoint(pt);
    if (hit) {
      application.selection.setFor(hit);
    }
  };

  const onMouseMove = (pt: Point) => {
    if (!canvasRef.current) {
      return;
    }

    let cursor = "auto";
    const hit = application.elementAtPoint(pt);
    if (hit) {
      switch (hit.type) {
        case "Note":
        case "Rest":
          cursor = "pointer";
          break;
      }
    }

    canvasRef.current.style.cursor = cursor;
  };

  return <Canvas ref={canvasRef} render={render} size={part.box} onClick={onClick} onMouseMove={onMouseMove} />;
});
