import * as CSS from "csstype";
import { observer } from "mobx-react-lite";
import { LayoutElement, PX_PER_MM, toAncestorCoordinateSystem } from "../../../layout";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { useEffect, useRef } from "preact/hooks";

export const ElementBoundPalette = observer(
  <ElementT extends LayoutElement, T>(props: {
    element: ElementT;
    currentValue?: T;
    options: Record<string, T>;
    close: () => void;
    onSelect: (value: T, element: ElementT) => void;
  }) => {
    const application = useApplicationState();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (ref.current) {
        ref.current.focus();
      }
    }, [ref]);

    const box = application.canvas.userSpaceToCanvasViewport(toAncestorCoordinateSystem(props.element));
    const style = {
      top: `${box.y}px`,
      left: `${box.centerX}px`,
      fontSize: `${Math.log(-application.canvas.userspaceToCanvasFactor / PX_PER_MM)}px`,
      transform: `translate(-50%, -100%)`,
      color: "#ffffff",
      position: "absolute",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      outline: "none",
      filter: "drop-shadow(3px 3px 2px rgba(0, 0, 0, 0.3))",
    } satisfies CSS.Properties;

    return (
      <div ref={ref} style={style} tabIndex={1} onBlur={() => props.close()}>
        <div className="palette">
          {Object.entries(props.options).map(([label, value]) => (
            <span
              key={label}
              onClick={() => {
                props.onSelect(value, props.element);
                props.close();
              }}
              className={`${value == props.currentValue ? " bg-gray-500" : ""}`}
            >
              {label}
            </span>
          ))}
        </div>
        <svg className="fill-gray-800 h-auto max-h-4" viewBox="0 0 24 10">
          <path d="M 0 0 c 12 1 10 10 12 10 C 14 10 12 1 24 0" />
        </svg>
      </div>
    );
  },
);
