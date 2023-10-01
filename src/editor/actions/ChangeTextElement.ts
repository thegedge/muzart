import layout from "../../layout";
import { SelectionTrackingAction } from "./SelectionTrackingAction";

export class ChangeTextElement extends SelectionTrackingAction {
  private prev: string;

  constructor(
    readonly element: layout.Text,
    readonly text: string,
  ) {
    super();
    this.prev = element.text;
  }

  canApply() {
    return this.element.text != this.text;
  }

  apply() {
    this.prev = this.element.text;
    this.element.text = this.text;
  }

  undo() {
    this.element.text = this.prev;
  }
}
