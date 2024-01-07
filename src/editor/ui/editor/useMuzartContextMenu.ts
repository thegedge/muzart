import { JSXInternal } from "preact/src/jsx";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export const useMuzartContextMenu = (subject: unknown) => {
  const application = useApplicationState();

  const onContextMenu: JSXInternal.MouseEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    application.state.showContextMenuFor(subject, event.pageX, event.pageY);
  };

  return { onContextMenu };
};
