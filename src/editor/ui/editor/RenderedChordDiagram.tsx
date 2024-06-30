import { useEffect, useMemo } from "preact/hooks";
import { ChordDiagram } from "../../../layout/elements/ChordDiagram";
import { renderScoreElement } from "../../../render/renderScoreElement";
import { StyleComputer } from "../../../render/StyleComputer";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { Canvas } from "../canvas/Canvas";
import { CanvasState } from "../canvas/CanvasState";

export const RenderedChordDiagram = (props: { diagram: ChordDiagram; styler: StyleComputer }) => {
  const application = useApplicationState();

  const state = useMemo(() => new CanvasState(), []);
  useEffect(() => {
    return () => state.dispose();
  }, [state]);

  useEffect(() => {
    const diagram = new ChordDiagram({
      ...props.diagram.diagram,
      name: "",
    });

    state.setRenderFunction((context, viewport) => {
      renderScoreElement(diagram, context, {
        application,
        viewport,
        ancestors: [],
        style: { color: "#ffffff" },
        styler: props.styler,
      });
    });

    // TODO properly draw chord diagram inside of its box so there's no need to translate
    const baseFret = diagram.diagram.diagram?.baseFret ?? 1;
    state.setUserSpaceSize(props.diagram.box);
    state.setViewport(props.diagram.box.translate(baseFret > 1 ? -2.5 : -1, 0));
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
