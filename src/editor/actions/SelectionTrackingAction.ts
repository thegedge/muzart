import { Application } from "../state/Application";
import { Action } from "./Action";

/**
 * Create an action that will restore state before undoing/redoing.
 */
export abstract class SelectionTrackingAction extends Action {
  private selection = null as Record<string, unknown> | null;

  constructor() {
    super();
  }

  apply(application: Application) {
    if (this.selection) {
      application.selection.fromJSON(this.selection);
    }
    this.selection ??= application.selection.toJSON();
  }

  undo(application: Application) {
    if (this.selection) {
      application.selection.fromJSON(this.selection);
    }
  }
}
