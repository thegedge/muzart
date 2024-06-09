import * as CSS from "csstype";
import { observer } from "mobx-react-lite";
import { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { AnyLayoutElement, PX_PER_MM, toAncestorCoordinateSystem } from "../../../layout";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export const ElementBoundPalette = observer(
  <ElementT extends AnyLayoutElement, T>(props: {
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
      fontSize: `${Math.log(-application.canvas.userspaceToCanvasFactorY / PX_PER_MM)}px`,
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
        <div className="flex h-auto w-full justify-around rounded-md bg-gray-800 font-serif italic">
          {Object.entries(props.options).map(([label, value]) => {
            const onSelect = () => {
              props.onSelect(value, props.element);
              props.close();
            };

            return (
              <PaletteEntry key={label} onClick={onSelect} value={value} current={value === props.currentValue}>
                {label}
              </PaletteEntry>
            );
          })}
        </div>
        <svg className="h-auto max-h-4 fill-gray-800" viewBox="0 0 24 10">
          <path d="M 0 0 c 12 1 10 10 12 10 C 14 10 12 1 24 0" />
        </svg>
      </div>
    );
  },
);

function PaletteEntry<T>(props: { onClick: () => void; children: ComponentChildren; value: T; current: boolean }) {
  return (
    <span
      onClick={props.onClick}
      className={`cursor-pointer rounded-md px-3 py-1 text-center hover:bg-gray-600 ${
        props.current ? "bg-gray-500" : ""
      }`}
    >
      {props.children}
    </span>
  );
}
