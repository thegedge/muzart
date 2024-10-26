import type { Application } from "../state/Application";
import type { Action } from "./Action";

export class CompositeAction implements Action {
  private actions: Action[];

  constructor(...actions: Action[]) {
    this.actions = actions;
  }

  apply(app: Application): void {
    for (const action of this.actions) {
      action.apply(app);
    }
  }

  undo(app: Application): void {
    for (const action of this.actions.reverse()) {
      action.undo?.(app);
    }
  }
}
