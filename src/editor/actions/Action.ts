import { Application } from "../state/Application";

/**
 * An action that can be dispatched within muzart.
 */
export abstract class Action {
  /**
   * Whether or not this action can be applied to the current application state.
   */
  abstract canApply(application: Application): boolean;

  /**
   * Apply the action to the given application.
   */
  abstract apply(application: Application): void;

  /**
   * Undo the action.
   */
  abstract undo(application: Application): void;
}
