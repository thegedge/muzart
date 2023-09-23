import type * as CSS from "csstype";
import { sumBy } from "lodash";
import { reaction } from "mobx";
import { observer, useLocalObservable } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import layout, {
  AllElements,
  Box,
  LINE_STROKE_WIDTH,
  LineElement,
  STAFF_LINE_HEIGHT,
  ancestorOfType,
  chordWidth,
  hitTest,
  isChord,
  toAncestorCoordinateSystem,
} from "../../../layout";
import { noteValueToSeconds } from "../../../playback/util/durations";
import { renderScoreElement } from "../../../render/renderScoreElement";
import { StyleComputer } from "../../../utils/StyleComputer";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Canvas, Point, RenderFunction } from "../misc/Canvas";
import { StatefulInput, StatefulTextInputState } from "./StatefulInput";
import "./score.css";

export const Score = observer((_props: Record<string, never>) => {
  const application = useApplicationState();

  useEffect(() => {
    return reaction(
      () => application.selection.part?.box,
      (box) => {
        if (box) {
          application.canvas.setUserSpaceSize(box);
        }
      },
      { fireImmediately: true },
    );
  }, [application.canvas]);

  const selectionBoxFor = (chord: layout.Chord | layout.Rest, selectedNoteIndex: number) => {
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
              application.canvas.redraw();
            }, 20);
          }
        } else {
          clearInterval(currentPlayingRefreshInterval.current);
          currentPlayingRefreshInterval.current = 0;
          application.canvas.redraw();
        }
      },
    );

    return () => {
      disposer();
      clearInterval(currentPlayingRefreshInterval.current);
    };
  });

  const renderState = useLocalObservable(() => ({ epoch: 0 }));
  useEffect(() => {
    import.meta.hot?.on("muzart:render", () => {
      // Set a timeout to allow the CSS to reload
      setTimeout(() => {
        renderState.epoch += 1;
      }, 200);
    });
  }, [renderState]);

  useEffect(() => {
    const part = application.selection.part;
    if (!part) {
      return;
    }

    const render: RenderFunction = (context, viewport) => {
      const stylesheet = Array.from(document.styleSheets).find((ss) => {
        for (let ruleIndex = 0; ruleIndex < ss.cssRules.length; ++ruleIndex) {
          if (ss.cssRules.item(ruleIndex)?.cssText.includes(".score")) {
            return true;
          }
        }
        return false;
      });

      const styling = new StyleComputer(stylesheet);
      renderScoreElement(part, context, {
        application,
        viewport,
        styling,
        ancestors: [],
        style: {},
      });

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
      } else if (application.selection.chord) {
        // Selection box
        const selectionBox = selectionBoxFor(application.selection.chord, application.selection.noteIndex);

        context.fillStyle = "#f0f0a055";
        context.strokeStyle = "#a0a050";
        context.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
        context.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      }
    };

    application.canvas.setRenderFunction(render);

    return reaction(
      () => [
        application.selection.partIndex,
        application.selection.measureIndex,
        application.selection.chordIndex,
        application.selection.noteIndex,
        application.selection.note,
        application.debug.enabled,
        renderState.epoch,
      ],
      () => {
        application.canvas.redraw();
      },
    );
  }, [application.canvas, application, application.selection.part, renderState]);

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
          const chord = ancestorOfType<LineElement, layout.Chord>(element, "Chord");
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

        application.canvas.ensureInView(box);
      },
    );
  }, [application]);

  const [textInputState, showTextInput] = useState<StatefulTextInputState | null>(null);

  const onMouseDown = useCallback(
    (pt: Point) => {
      const hit = hitTest(pt, application.selection.part);
      if (hit) {
        application.selection.setFor(hit.element);
        if (isChord(hit.element)) {
          application.selection.update({
            noteIndex: Math.floor(hit.point.y / hit.element.staffHeight),
          });
        } else if (hit.element.type == "Note") {
          application.playback.playSelectedNote();
        }
      }
    },
    [application, textInputState],
  );

  const onDoubleClick = useCallback(
    (pt: Point) => {
      const hit = hitTest(pt, application.selection.part);
      if (hit) {
        if (hit?.element.type == "Text" && !hit.element.isReadOnly) {
          showTextInput(new StatefulTextInputState(application, hit.element));
        }
      }
    },
    [application, textInputState],
  );

  const onMouseMove = useCallback(
    (pt: Point) => {
      let cursor: CSS.Properties["cursor"] = "auto";

      const hit = hitTest(pt, application.selection.part);
      if (hit) {
        switch (hit.element.type) {
          case "Chord":
          case "Note":
          case "Rest":
            cursor = "pointer";
            break;
          case "Text":
            if (!hit.element.isReadOnly) {
              cursor = "text";
            }
            break;
        }
      }

      application.canvas.setCursor(cursor);
    },
    [application],
  );

  return (
    <div className="flex-1 overflow-hidden">
      {textInputState?.visible && <StatefulInput state={textInputState} />}
      <Canvas
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onMouseMove={onMouseMove}
        state={application.canvas}
      />
    </div>
  );
});
