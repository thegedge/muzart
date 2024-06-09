import { useMergeRefs } from "@floating-ui/react";
import { type JSX } from "preact";
import { forwardRef, useEffect, useRef, type PropsWithChildren } from "preact/compat";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export const Popover = forwardRef<HTMLElement, PropsWithChildren<JSX.HTMLAttributes>>((props, ref) => {
  const application = useApplicationState();
  const modalRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergeRefs([ref as any, modalRef]);
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) {
      return;
    }

    // TODO this triggers on the mouse up event after a context menu event, which makes it hard to use for context
    //  menus since they close right away. Not sure the best way to deal with that!
    const listener = (event: Event) => {
      // REMOVEME this cast will be unnecessary once addEventListener("toggle", ...) is typed correctly
      if ((event as ToggleEvent).newState == "closed") {
        // TODO a better way of just saying "hide the active thing"?
        application.state.hideModal();
        application.state.hideContextMenu();
        application.state.hideTooltipImmediately();
      }
    };

    modal.addEventListener("toggle", listener);
    return () => {
      modal.removeEventListener("toggle", listener);
    };
  }, [modalRef]);

  return <div ref={mergedRef} {...props} popover={props.popover ?? "auto"} />;
});
