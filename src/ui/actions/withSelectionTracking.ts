import { Action } from "../state/Application";

/**
 * Create an action that will restore state before undoing/redoing.
 */
export function withSelectionTracking(action: Action): Action {
  let selection = null as Record<string, unknown> | null;

  return {
    canApplyAction(application) {
      return action.canApplyAction(application);
    },

    apply(application) {
      if (selection) {
        application.selection.fromJSON(selection);
      }
      action.apply(application);
      selection = application.selection.toJSON();
    },

    undo(application) {
      if (selection) {
        application.selection.fromJSON(selection);
      }
      action.undo(application);
      selection = application.selection.toJSON();
    },
  };
}
