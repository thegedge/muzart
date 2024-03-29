import * as CSS from "csstype";
import { merge } from "lodash";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { CSSProperties, useEffect, useRef } from "preact/compat";
import layout, { toAncestorCoordinateSystem } from "../../../layout";
import { StyleComputer } from "../../../utils/StyleComputer";
import { changeTextAction } from "../../actions/editing/ChangeTextElement";
import { Application } from "../../state/Application";

export const StatefulInput = observer((props: { state: StatefulTextInputState }) => {
  const text = useRef(props.state.element.text);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // inputRef.current?.select();
    inputRef.current?.focus();
  }, [inputRef]);

  return (
    <div
      ref={inputRef}
      contentEditable
      className="absolute whitespace-pre-wrap bg-white"
      style={props.state.style}
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

  get style(): CSSProperties {
    const canvas = this.application?.canvas;
    if (!canvas || !this.element) {
      return {};
    }

    const box = canvas.userSpaceToCanvasViewport(toAncestorCoordinateSystem(this.element));
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
