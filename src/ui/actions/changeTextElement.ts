import layout from "../../layout";
import { Action } from "../state/Application";

export const changeTextElement = (element: layout.Text, text: string): Action => {
  let prev!: string;
  return {
    apply() {
      prev = element.text;
      element.text = text;
    },

    undo() {
      element.text = prev;
    },
  };
};
