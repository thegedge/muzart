import { Application } from "../state/Application";

/**
 * An action that can be dispatched within muzart.
 */
export abstract class Action {
  /**
   * Apply the action to the given application.
   */
  abstract apply(application: Application): void;

  /**
   * Undo the action.
   */
  undo?(): void;
}
