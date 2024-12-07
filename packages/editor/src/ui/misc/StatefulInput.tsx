import * as layout from "@muzart/layout";
import { StyleComputer } from "@muzart/render";
import clsx from "clsx";
import type * as CSS from "csstype";
import { merge } from "lodash-es";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, type CSSProperties } from "react";
import { changeTextAction } from "../../actions/editing/ChangeTextElement";
import { Application } from "../../state/Application";

export const StatefulInput = observer((props: { state: StatefulTextInputState }) => {
  const text = useRef(props.state.element.text);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // inputRef.current?.select();
    inputRef.current?.focus();
  }, [inputRef]);

  const className = clsx(
    "absolute flex whitespace-pre-wrap bg-white",
    textAlignToTailwindClass(props.state.style.textAlign),
    verticalAlignToTailwindClass(props.state.style.verticalAlign),
  );

  return (
    <div
      ref={inputRef}
      contentEditable
      className={className}
      style={props.state.style as CSSProperties}
      onKeyDown={(e) => {
        if (e.code == "Escape") {
          e.preventDefault();
          props.state.hide();
        } else if (e.code == "Enter" && !e.shiftKey) {
          // TODO should probably indicate whether or not an element is multiline
          e.preventDefault();
          props.state.complete(e.currentTarget.innerText);
        }
      }}
      onInput={(e) => {
        text.current = e.currentTarget.innerText;
      }}
      onBlur={(e) => props.state.complete(e.currentTarget.innerText)}
    >
      {text.current}
    </div>
  );
});

export class StatefulTextInputState {
  public visible = true;

  private styles: CSS.Properties;

  constructor(
    readonly application: Application,
    readonly element: layout.Text,
    styler: StyleComputer,
  ) {
    this.styles = merge(styler.stylesFor(this.element, []), this.element.style);
    makeAutoObservable(this, undefined, { deep: false });
  }

  get style(): CSS.Properties {
    const canvas = this.application.canvas;
    const box = canvas.userSpaceToCanvasViewport(layout.toAncestorCoordinateSystem(this.element));
    return {
      top: `${box.y}px`,
      left: `${box.x}px`,
      width: `${box.width}px`,
      minHeight: `${box.height}px`,
      fontSize: `${this.element.size * canvas.userspaceToCanvasFactorX}px`,
      lineHeight: `${this.element.size * canvas.userspaceToCanvasFactorX}px`,
      outline: "none",
      ...this.styles,
    } as const;
  }

  hide() {
    this.visible = false;
  }

  complete(text: string) {
    if (!this.visible) {
      return;
    }

    this.application.dispatch(changeTextAction(this.element, text).actionForState(this.application));
    this.visible = false;
  }
}

const textAlignToTailwindClass = (value: CSS.Property.TextAlign | undefined) => {
  switch (value) {
    case "center":
      return "justify-center";
    case "right":
      return "justify-end";
    default:
      return "justify-start";
  }
};

const verticalAlignToTailwindClass = (value: CSS.Property.VerticalAlign | undefined) => {
  switch (value) {
    case "middle":
      return "items-center";
    case "baseline":
    case "bottom":
    case "sub":
    case "text-bottom":
      return "items-end";
    default:
      return "items-start";
  }
};
