import { mapValues, sumBy } from "lodash";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef } from "preact/hooks";
import { createKeybindingsHandler } from "tinykeys";
import {
  AllElements,
  Box,
  Chord,
  LINE_STROKE_WIDTH,
  LineElement,
  Rest,
  STAFF_LINE_HEIGHT,
  ancestorOfType,
  chordWidth,
  isChord,
  toAncestorCoordinateSystem,
} from "../../../layout";
import { noteValueToSeconds } from "../../../playback/util/durations";
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

export const Score = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const { settingsStorage, error, selection, playback } = application;

  if (error) {
    throw error; // Let the ErrorBoundary figure it out
  }

  const part = selection.part;
  const state = useMemo(() => new CanvasState(settingsStorage), []);

  useEffect(() => {
    return () => state.dispose();
  }, [state]);

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

          "Home": () => {
            application.selection.update({ measureIndex: 0 });
          },
          "End": () => {
            const part = selection.part;
            application.selection.update({ measureIndex: part && part.part.measures.length - 1 });
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
        preventDefault,
      ),
    );

    document.body.addEventListener("keydown", listener);
    return () => {
      document.body.removeEventListener("keydown", listener);
    };
  }, [application, state]);

  useEffect(() => {
    return reaction(
      () => application.selection.part?.box,
      (box) => {
        if (box) {
          state.setUserSpaceSize(box);
        }
      },
      { fireImmediately: true },
    );
  }, [state, application]);

  const selectionBoxFor = (chord: Chord | Rest, selectedNoteIndex: number) => {
    const PADDING = 3 * LINE_STROKE_WIDTH;
    const chordBox = toAncestorCoordinateSystem(chord);
    return chordBox
      .update({
        y: chordBox.y + selectedNoteIndex * STAFF_LINE_HEIGHT,
        width: chord.type == "Chord" ? chordBox.width : STAFF_LINE_HEIGHT,
        height: STAFF_LINE_HEIGHT,
      })
      .expand(PADDING);
  };

  const currentPlayingRefreshInterval = useRef(0);
  useEffect(() => {
    const disposer = reaction(
      () => application.playback.playing,
      (playing) => {
        if (playing) {
          if (currentPlayingRefreshInterval.current == 0) {
            currentPlayingRefreshInterval.current = window.setInterval(() => {
              state.redraw();
            }, 20);
          }
        } else {
          clearInterval(currentPlayingRefreshInterval.current);
          currentPlayingRefreshInterval.current = 0;
          state.redraw();
        }
      },
    );

    return () => {
      disposer();
      clearInterval(currentPlayingRefreshInterval.current);
    };
  });

  useEffect(() => {
    const part = application.selection.part;
    if (!part) {
      return;
    }

    const render: RenderFunction = (context, viewport) => {
      renderScoreElement(application, context, part, viewport);

      if (application.playback.playing) {
        // Playback box
        const measure = application.playback.currentMeasure;
        if (measure) {
          const currentTempo = application.playback.tempoOfSelection;
          const measureTime = sumBy(measure.measure.chords, (chord) => noteValueToSeconds(chord.value, currentTempo));
          const timeIntoMeasure = application.playback.currentTime - application.playback.startOfCurrentMeasure;

          const firstChordX = measure.chords[0].box.x;
          const lastChordX = measure.chords[measure.chords.length - 1].box.right;
          const measureBox = toAncestorCoordinateSystem(measure);

          const x = measureBox.x + firstChordX + (lastChordX - firstChordX) * (timeIntoMeasure / measureTime);
          const halfW = chordWidth(1.5);

          context.fillStyle = "#ff000033";
          context.fillRect(
            x - halfW,
            measureBox.y - 0.75 * STAFF_LINE_HEIGHT,
            2 * halfW,
            measureBox.height + 1.5 * STAFF_LINE_HEIGHT,
          );
        }
      } else if (selection.chord) {
        // Selection box
        const selectionBox = selectionBoxFor(selection.chord, selection.noteIndex);

        context.fillStyle = "#f0f0a055";
        context.strokeStyle = "#a0a050";
        context.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
        context.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      }
    };

    state.setRenderFunction(render);

    return reaction(
      () => [
        application.selection.partIndex,
        application.selection.measureIndex,
        application.selection.chordIndex,
        application.selection.noteIndex,
        application.debug.enabled,
      ],
      () => {
        state.redraw();
      },
    );
  }, [state, application, application.selection.part]);

  useEffect(() => {
    return reaction(
      () =>
        [
          application.playback.currentMeasure ?? application.selection.element,
          application.selection.noteIndex,
        ] as const,
      ([element, selectedNoteIndex]) => {
        if (!element) {
          return;
        }

        let box: Box;
        if (element.type == "Chord" || element.type == "Rest") {
          box = selectionBoxFor(element, selectedNoteIndex);
        } else if (element.type == "Note") {
          const chord = ancestorOfType<LineElement, Chord>(element, "Chord");
          if (chord) {
            box = selectionBoxFor(chord, selectedNoteIndex);
          } else {
            const line = ancestorOfType<AllElements>(element, "PageLine") ?? element;
            box = toAncestorCoordinateSystem(line);
          }
        } else {
          const line = ancestorOfType<AllElements>(element, "PageLine") ?? element;
          box = toAncestorCoordinateSystem(line);
        }

        state.ensureInView(box);
      },
    );
  }, [application]);

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
      } else if (hit.element.type == "Note") {
        playback.playSelectedNote();
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

  return <Canvas onClick={onClick} onMouseMove={onMouseMove} state={state} />;
});
