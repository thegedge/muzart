import * as layout from "@muzart/layout";
import { Application } from "../../state/Application";
import { Action } from "../Action";

export const changeTextAction = (element: layout.Text, text: string) => {
  return class ChangeTextElement extends Action {
    // TODO - if there were some name on the element, it would make a better name here
    static readonly name = `Change text to ${text}`;
    static readonly when = "editorFocused";
    static readonly defaultKeyBinding = null;

    static actionForState(_application: Application) {
      return element.text != text ? new ChangeTextElement(element, text) : null;
    }

    private prev: string;

    constructor(
      readonly element: layout.Text,
      readonly text: string,
    ) {
      super();
      this.prev = element.text;
    }

    apply() {
      this.prev = this.element.text;
      this.element.text = this.text;
    }

    undo() {
      this.element.text = this.prev;
    }
  };
};
