import layout from "../../layout";
import { Action, Application } from "../state/Application";

export const changeTextElement = (application: Application, element: layout.Text, text: string): Action => {
  return () => {
    const prev = element.text;
    application.undoStack.push([
      () => {
        element.text = text;
      },
      () => {
        element.text = prev;
      },
    ]);
  };
};
