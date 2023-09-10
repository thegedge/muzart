import { sumBy } from "lodash";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef } from "preact/hooks";
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
        application.debug.enabled,
      ],
      () => {
        application.canvas.redraw();
      },
    );
  }, [application.canvas, application, application.selection.part]);

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

        application.canvas.ensureInView(box);
      },
    );
  }, [application]);

  const onClick = useCallback(
    (pt: Point) => {
      const hit = application.hitTest(pt);
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
    [application],
  );

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

    application.canvas.setCursor(cursor);
  };

  return <Canvas onClick={onClick} onMouseMove={onMouseMove} state={application.canvas} />;
});
