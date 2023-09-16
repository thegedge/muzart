import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { CSSProperties, useEffect, useRef } from "preact/compat";
import layout, { toAncestorCoordinateSystem } from "../../../layout";
import { changeTextElement } from "../../actions/changeTextElement";
import { Application } from "../../state/Application";

export class StatefulTextInputState {
  public visible = true;

  constructor(
    readonly application: Application,
    readonly element: layout.Text,
  ) {
    makeAutoObservable(this, undefined, { deep: false });
  }

  get style(): CSSProperties {
    const canvas = this.application?.canvas;
    if (!canvas || !this.element) {
      return {};
    }

    const absoluteBox = toAncestorCoordinateSystem(this.element);
    return {
      top: `${absoluteBox.y * canvas.userspaceToCanvasFactor - canvas.scrollY}px`,
      left: `${absoluteBox.x * canvas.userspaceToCanvasFactor - canvas.scrollX}px`,
      width: `${absoluteBox.width * canvas.userspaceToCanvasFactor}px`,
      height: `${absoluteBox.height * canvas.userspaceToCanvasFactor}px`,
      fontSize: `${this.element.size * canvas.userspaceToCanvasFactor}px`,
      textAlign: this.element.halign,
      verticalAlign: this.element.valign == "start" ? "top" : this.element.valign == "end" ? "bottom" : undefined,
      outline: "none",
      ...this.element.style,
    } as const;
  }

  hide() {
    this.visible = false;
  }

  complete(text: string) {
    if (!this.visible) {
      return;
    }

    const element = this.element;
    if (element && element.text != text) {
      this.application.dispatch(changeTextElement(element, text));
    }

    this.visible = false;
  }
}

export const StatefulInput = observer((props: { state: StatefulTextInputState }) => {
  const text = useRef(props.state.element.text);
  const inputRef = useRef<HTMLInputElement>(null);

  // TODO zooming and whatnot can hide this input. How can we limit what causes the blur?

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
