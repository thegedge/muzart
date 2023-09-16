import { Application } from "../state/Application";

export function undoableAction<T>(
  application: Application,
  apply: () => T | undefined,
  undo: (state: T) => void,
): () => void {
  return () => {
    const selectionBeforeApply = application.selection.toJSON();
    const state = apply();
    if (state !== undefined) {
      const selectionAfterApply = application.selection.toJSON();
      application.undoStack.push([
        () => {
          application.selection.fromJSON(selectionBeforeApply);
          apply();
        },
        () => {
          application.selection.fromJSON(selectionAfterApply);
          undo(state);
        },
      ]);
    }
  };
}
