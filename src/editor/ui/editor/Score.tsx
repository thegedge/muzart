import type * as CSS from "csstype";
import { sumBy } from "lodash";
import { reaction } from "mobx";
import { observer, useLocalObservable } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import layout, {
  STAFF_LINE_HEIGHT,
  chordWidth,
  getAncestorOfType,
  hitTest,
  isChord,
  toAncestorCoordinateSystem,
} from "../../../layout";
import { ChordDiagram } from "../../../layout/elements/ChordDiagram";
import { Note } from "../../../layout/elements/Note";
import * as notation from "../../../notation";
import { noteValueToSeconds } from "../../../playback/util/durations";
import { renderScoreElement } from "../../../render/renderScoreElement";
import { StyleComputer } from "../../../utils/StyleComputer";
import { changeNoteAction } from "../../actions/editing/ChangeNote";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Canvas, Point, RenderFunction } from "../canvas/Canvas";
import { CanvasState } from "../canvas/CanvasState";
import { VirtualCanvasElement } from "../canvas/VirtualCanvasElement";
import { StatefulInput, StatefulTextInputState } from "../misc/StatefulInput";
import { ElementBoundPalette } from "./ElementBoundPalette";
import { selectionBoxFor } from "../misc/selectionBoxFor";

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
    const score = application.selection.score;
    if (!score) {
      return;
    }

    const render: RenderFunction = (context, viewport) => {
      renderScoreElement(score, context, {
        application,
        viewport,
        styler,
        ancestors: [],
        style: {},
      });

      if (application.playback.playing) {
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
        application.debug.hoveredElement,
        renderState.epoch,
      ],
      () => {
        application.canvas.redraw();
      },
    );
  }, [application.canvas, application, application.selection.part, renderState, styler]);

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
      if (hit?.element.type == "Text" && !hit.element.isReadOnly) {
        showTextInput(new StatefulTextInputState(application, hit.element, styler));
      }
    },
    [application, styler],
  );

  const onMouseMove = useCallback(
    (pt: Point, _event: MouseEvent) => {
      let cursor: CSS.Properties["cursor"] = "auto";

      const hit = hitTest(pt, application.selection.part);
      if (hit) {
        switch (hit.element.type) {
          case "Chord":
          case "Note":
          case "Rest":
            cursor = "pointer";
            break;
          case "Text": {
            const parent = hit.element.parent;
            if (parent?.type == "Note") {
              cursor = "pointer";
            } else if (parent?.type == "ChordDiagram") {
              if (getAncestorOfType(hit.element, "PageLine") !== null) {
                cursor = "help";

                // TODO figure out how to get TS to properly narrow this to a `ChordDiagram`
                const diagram = (parent as ChordDiagram).diagram;
                const diagramElementToRender = new ChordDiagram(diagram);

                // TODO make this an "on enter" instead of checking truthiness of the tooltip
                if (!application.state.tooltip) {
                  application.state.showTooltip({
                    subject: diagram,
                    children: <RenderedChordDiagram diagram={diagramElementToRender} styler={styler} />,
                    reference: new VirtualCanvasElement(hit.element, application.canvas),
                  });
                }
              }
            } else if (!hit.element.isReadOnly) {
              cursor = "text";
            }
            break;
          }
        }
      }

      application.debug.setHoveredElement(hit?.element ?? null);
      application.canvas.setCursor(cursor);
    },
    [application.canvas, application.debug, application.selection.part, application.state, styler],
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
    <div className="score relative h-full w-full overflow-hidden bg-gray-500">
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

const RenderedChordDiagram = (props: { diagram: ChordDiagram; styler: StyleComputer }) => {
  const application = useApplicationState();

  const state = useMemo(() => new CanvasState(), []);
  useEffect(() => {
    return () => state.dispose();
  }, [state]);

  useEffect(() => {
    state.setRenderFunction((context, viewport) => {
      renderScoreElement(props.diagram, context, {
        application,
        viewport,
        ancestors: [],
        style: { color: "#ffffff" },
        styler: props.styler,
      });
    });

    // TODO properly draw chord diagram inside of its box so there's no need to translate
    state.setUserSpaceSize(props.diagram.box);
    state.setViewport(props.diagram.box.translate(-2.5, 0));
  }, [state, application, props.diagram, props.styler]);

  return (
    <div
      className="relative max-w-48 overflow-hidden"
      style={{ aspectRatio: `${props.diagram.box.width} / ${props.diagram.box.height}` }}
    >
      <Canvas state={state} disabled />
    </div>
  );
};
