import { mapValues } from "lodash";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo } from "preact/hooks";
import { createKeybindingsHandler } from "tinykeys";
import {
  AllElements,
  ancestorOfType,
  isChord,
  LINE_STROKE_WIDTH,
  STAFF_LINE_HEIGHT,
  toAncestorCoordinateSystem,
} from "../../../layout";
import { renderScoreElement } from "../../../render/renderScoreElement";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Canvas, Point, RenderFunction } from "../misc/Canvas";
import { CanvasState } from "../misc/CanvasState";

const preventDefault = (f: (event: KeyboardEvent) => void) => {
  return (event: KeyboardEvent) => {
    event.preventDefault();
    f(event);
  };
};

export const Score = observer((_props: never) => {
  const application = useApplicationState();
  const { error, selection, playback } = application;

  if (error) {
    throw error; // Let the ErrorBoundary figure it out
  }

  const part = selection.part;
  const state = useMemo(() => new CanvasState(), []);

  useEffect(() => {
    const listener = createKeybindingsHandler(
      mapValues(
        {
          // Playback ----------------------------------------------------------

          "Space": () => {
            playback.togglePlay();
          },

          // Navigation --------------------------------------------------------

          // TODO some of these shouldn't work when playing

          "ArrowLeft": () => {
            application.selection.previousChord();
          },
          "ArrowRight": () => {
            application.selection.nextChord();
          },
          "ArrowUp": () => {
            application.selection.previousNote();
          },
          "ArrowDown": () => {
            application.selection.nextNote();
          },

          // TODO should these jump a visible page, or an actual page?
          "PageDown": () => {
            application.selection.nextPage();
          },
          "PageUp": () => {
            application.selection.previousPage();
          },

          "$mod+Shift+ArrowLeft": () => {
            application.selection.previousMeasure();
          },
          "$mod+Shift+ArrowRight": () => {
            application.selection.nextMeasure();
          },

          "$mod+Alt+ArrowUp": () => {
            application.selection.previousPart();
          },
          "$mod+Alt+ArrowDown": () => {
            application.selection.nextPart();
          },

          // Debugging ---------------------------------------------------------

          "Shift+D": () => {
            application.debug.setEnabled(!application.debug.enabled);
          },
        },
        preventDefault
      )
    );

    document.body.addEventListener("keydown", listener);
    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [application, state]);

  const render = useCallback<RenderFunction>(
    (context, viewport) => {
      if (!part) {
        return;
      }

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

  useEffect(() => {
    return reaction(
      () => application.playback.currentMeasure ?? application.selection.element,
      (element) => {
        if (!element) {
          return;
        }

        const line = ancestorOfType<AllElements>(element, "PageLine") ?? element;
        const absoluteBox = toAncestorCoordinateSystem(line);
        state.ensureInView(absoluteBox);
      }
    );
  }, [application.selection]);

  if (!part) {
    return null;
  }

  const onClick = (pt: Point) => {
    const hit = application.hitTest(pt);
    if (hit) {
      application.selection.setFor(hit.element);
      if (isChord(hit.element)) {
        application.selection.update({
          noteIndex: Math.floor(hit.point.y / hit.element.staffHeight),
        });
      } else {
        // TODO Playback of note when clicking note (maybe best in application state?)
      }
    }
  };

  const onMouseMove = (pt: Point) => {
    let cursor = "auto";
    const hit = application.hitTest(pt);
    if (hit) {
      switch (hit.element.type) {
        case "Chord":
        case "Note":
        case "Rest":
          cursor = "pointer";
          break;
      }
    }

    state.setCursor(cursor);
  };

  return <Canvas render={render} size={part.box} onClick={onClick} onMouseMove={onMouseMove} state={state} />;
});
