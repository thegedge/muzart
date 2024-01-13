import * as CSS from "csstype";
import { merge } from "lodash";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { CSSProperties, useEffect, useRef } from "preact/compat";
import layout, { toAncestorCoordinateSystem } from "../../../layout";
import { StyleComputer } from "../../../utils/StyleComputer";
import { changeTextAction } from "../../actions/ChangeTextElement";
import { Application } from "../../state/Application";

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
      height: `${box.height}px`,
      fontSize: `${this.element.size * canvas.userspaceToCanvasFactor}px`,
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

export const StatefulInput = observer((props: { state: StatefulTextInputState }) => {
  const text = useRef(props.state.element.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
    inputRef.current?.focus();
  }, [inputRef]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={text.current}
      className="absolute"
      style={props.state.style}
      onKeyDown={(e) => {
        if (e.code == "Escape") {
          e.preventDefault();
          props.state.hide();
        } else if (e.code == "Enter") {
          e.preventDefault();
          props.state.complete(e.currentTarget.value);
        }
      }}
      onChange={(e) => {
        text.current = e.currentTarget.value;
      }}
      onBlur={(e) => props.state.complete(e.currentTarget.value)}
    />
  );
});
