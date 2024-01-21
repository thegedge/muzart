import type * as CSS from "csstype";
import { sumBy } from "lodash";
import { reaction } from "mobx";
import { observer, useLocalObservable } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
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
import { Note } from "../../../layout/elements/Note";
import * as notation from "../../../notation";
import { noteValueToSeconds } from "../../../playback/util/durations";
import { renderScoreElement } from "../../../render/renderScoreElement";
import { StyleComputer } from "../../../utils/StyleComputer";
import { changeNoteAction } from "../../actions/editing/ChangeNote";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Canvas, Point, RenderFunction } from "../canvas/Canvas";
import { StatefulInput, StatefulTextInputState } from "../misc/StatefulInput";
import { ElementBoundPalette } from "./ElementBoundPalette";

export const Score = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const currentPlayingRefreshInterval = useRef(0);
  const renderState = useLocalObservable(() => ({ epoch: 0 }));
  const [textInputState, showTextInput] = useState<StatefulTextInputState | null>(null);

  const styler = useMemo(() => {
    const stylesheet = Array.from(document.styleSheets).find((ss) => {
      for (let ruleIndex = 0; ruleIndex < ss.cssRules.length; ++ruleIndex) {
        if (ss.title == "muzart") {
          return true;
        }
      }
      return false;
    });

    return new StyleComputer(stylesheet);
  }, []);

  useEffect(() => {
    return reaction(
      () => application.selection.part?.box,
      (box) => {
        if (box) {
          application.canvas.setUserSpaceSize(box);
          application.canvas.centerViewportOn();
        }
      },
      { fireImmediately: true },
    );
  }, [application]);

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
    import.meta.hot?.on("muzart:render", () => {
      const link = document.querySelector(`link[href^="score.css"]`);
      if (link) {
        (link as HTMLLinkElement).href = `score.css?v=${renderState.epoch}`;
      }

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
      context.fillStyle = "";
      context.strokeStyle = "#000000";

      renderScoreElement(part, context, {
        application,
        viewport,
        styler,
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
  }, [application.canvas, application, application.selection.part, renderState, styler]);

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

  const onMouseDown = useCallback(
    (pt: Point) => {
      const hit = hitTest(pt, application.selection.part);
      if (hit) {
        application.selection.setFor(hit.element);
        if (isChord(hit.element)) {
          application.selection.update({
            noteIndex: Math.floor(hit.point.y / hit.element.staffHeight),
          });
        } else if (hit.element.type == "Note" || hit.element.parent?.type == "Note") {
          application.playback.playNote();
        }
      }
    },
    [application],
  );

  const onDoubleClick = useCallback(
    (pt: Point) => {
      const hit = hitTest(pt, application.selection.part);
      if (hit) {
        if (hit?.element.type == "Text" && !hit.element.isReadOnly) {
          showTextInput(new StatefulTextInputState(application, hit.element, styler));
        }
      }
    },
    [application, styler],
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
            if (hit.element.parent?.type == "Note") {
              cursor = "pointer";
            } else if (!hit.element.isReadOnly) {
              cursor = "text";
            }
            break;
        }
      }

      application.canvas.setCursor(cursor);
    },
    [application],
  );

  const onContextMenu = useCallback(
    (pt: Point, event: MouseEvent) => {
      let subject: unknown = null;
      let element: layout.AllElements | undefined | null = hitTest(pt, application.selection.score)?.element;
      while (element) {
        if (element.type == "Measure") {
          subject = element.measure;
          break;
        }

        // TODO can we avoid having to do this cast?
        element = element.parent as layout.AllElements | undefined | null;
      }

      if (subject) {
        event.stopPropagation();
        event.preventDefault();
        application.state.showContextMenuFor(subject, event.pageX, event.pageY);
      }
    },
    [application.selection.score, application.state],
  );

  // Relative positioning to so element-bound palettes can be positioned relative to the score
  return (
    <div className="score relative overflow-hidden bg-gray-500">
      {textInputState?.visible && <StatefulInput state={textInputState} />}
      {application.state.modalSubject instanceof Note && application.state.modalProperty == "dynamic" && (
        <ElementBoundPalette
          element={application.state.modalSubject}
          options={{
            [notation.NoteDynamic.Pianississimo]: notation.NoteDynamic.Pianississimo,
            [notation.NoteDynamic.Pianissimo]: notation.NoteDynamic.Pianissimo,
            [notation.NoteDynamic.Piano]: notation.NoteDynamic.Piano,
            [notation.NoteDynamic.MezzoPiano]: notation.NoteDynamic.MezzoPiano,
            [notation.NoteDynamic.MezzoForte]: notation.NoteDynamic.MezzoForte,
            [notation.NoteDynamic.Forte]: notation.NoteDynamic.Forte,
            [notation.NoteDynamic.Fortissimo]: notation.NoteDynamic.Fortissimo,
            [notation.NoteDynamic.Fortississimo]: notation.NoteDynamic.Fortississimo,
          }}
          currentValue={application.state.modalSubject.note.dynamic}
          close={() => application.state.hideModal()}
          onSelect={(dynamic, element) => {
            if (dynamic == element.note.dynamic) {
              application.dispatch(changeNoteAction({ dynamic: undefined }));
            } else {
              application.dispatch(changeNoteAction({ dynamic }));
            }
          }}
        />
      )}
      {application.state.modalSubject instanceof Note && application.state.modalProperty == "note.harmonic" && (
        <ElementBoundPalette
          element={application.state.modalSubject}
          options={{
            "N.H.": notation.HarmonicStyle.Natural,
            "P.H.": notation.HarmonicStyle.Pinch,
            "S.H": notation.HarmonicStyle.Semi,
            "T.H.": notation.HarmonicStyle.Tapped,
            "A.H. +5": notation.HarmonicStyle.ArtificialPlus5,
            "A.H. +7": notation.HarmonicStyle.ArtificialPlus7,
            "A.H. +12": notation.HarmonicStyle.ArtificialPlus12,
          }}
          currentValue={application.state.modalSubject.note.harmonic}
          close={() => application.state.hideModal()}
          onSelect={(harmonic, element) => {
            if (harmonic == element.note.harmonic) {
              application.dispatch(changeNoteAction({ harmonic: undefined }));
            } else {
              application.dispatch(changeNoteAction({ harmonic }));
            }
          }}
        />
      )}
      <Canvas
        onContextMenu={onContextMenu}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        state={application.canvas}
      />
    </div>
  );
});

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
