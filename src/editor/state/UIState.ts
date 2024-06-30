import { makeAutoObservable } from "mobx";
import { PlaybackController } from "../../playback/PlaybackController";
import { TooltipProps } from "../ui/misc/Tooltip";
import { PropertyPaths } from "../utils/types";

/**
 * Captures all of the state that is related to the UI of the editor.
 */
export class UIState {
  /** The subject for a context menu, or `null` if the context menu isn't visible */
  public contextMenuSubject: unknown = null;
  public contextMenuX = 0;
  public contextMenuY = 0;

  public tooltip: TooltipProps | null = null;
  private hideTooltipTimeout = 0;

  /** Whether or not the key bindings overlay should be visible */
  public helpVisible = false;

  /** Whether or not a modal is available for a given subject */
  public modalSubject: unknown = null;
  public modalProperty = "";

  constructor(readonly playback: PlaybackController) {
    makeAutoObservable(
      this,
      {
        hideTooltip: false,
      },
      { deep: false },
    );
  }

  get isPlaying() {
    return this.playback.playing;
  }

  get editorFocused() {
    // TODO this works...for now
    const activeElement = document.activeElement?.tagName.toLowerCase();
    return (
      (!document.activeElement ||
        (activeElement !== "input" &&
          activeElement !== "textarea" &&
          (!("isContentEditable" in document.activeElement) || !document.activeElement.isContentEditable))) &&
      !this.contextMenuSubject
    );
  }

  showContextMenuFor(subject: unknown, x = 0, y = 0) {
    this.contextMenuSubject = subject;
    this.contextMenuX = x;
    this.contextMenuY = y;
  }

  hideContextMenu() {
    this.contextMenuSubject = null;
    this.contextMenuX = 0;
    this.contextMenuY = 0;
  }

  showModalFor<T>(subject: T, property: PropertyPaths<T, 3>) {
    this.modalSubject = subject;
    this.modalProperty = property;
  }

  hideModal() {
    this.modalSubject = null;
    this.modalProperty = "";
  }

  showTooltip(tooltip: TooltipProps) {
    if (!this.tooltip || this.tooltip.subject !== tooltip.subject) {
      this.tooltip = tooltip;
    }

    clearTimeout(this.hideTooltipTimeout);
    this.hideTooltipTimeout = 0;
  }

  hideTooltip() {
    if (this.tooltip && !this.hideTooltipTimeout) {
      this.hideTooltipTimeout = window.setTimeout(() => {
        this.hideTooltipImmediately();
      }, this.tooltip.delay ?? 500);
    }
  }

  hideTooltipImmediately() {
    this.tooltip = null;
    clearTimeout(this.hideTooltipTimeout);
  }

  toggleHelp() {
    this.helpVisible = !this.helpVisible;
  }
}
