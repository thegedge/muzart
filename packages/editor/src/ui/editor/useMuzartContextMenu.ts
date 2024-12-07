import { type MouseEventHandler } from "react";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export const useMuzartContextMenu = (subject: unknown) => {
  const application = useApplicationState();

  const onContextMenu: MouseEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    application.state.showContextMenuFor(subject, event.pageX, event.pageY);
  };

  return { onContextMenu };
};
