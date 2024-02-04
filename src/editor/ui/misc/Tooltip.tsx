import {
  FloatingPortal,
  arrow,
  computePosition,
  flip,
  hide,
  offset,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import clsx from "clsx";
import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { JSX } from "preact";
import { useRef } from "preact/hooks";
import { PX_PER_MM } from "../../../layout";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { VirtualCanvasElement } from "../canvas/VirtualCanvasElement";

export type TooltipProps = {
  subject: unknown;
  children: JSX.Element;
  reference: VirtualCanvasElement;
  delay?: number;
};

export const Tooltip = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  const arrowRef = useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context, placement, middlewareData } = useFloating({
    placement: "top",
    open: !!application.state.tooltip,
    middleware: [offset(10), flip(), hide(), arrow({ element: arrowRef })],

    onOpenChange(open: boolean) {
      if (!open) {
        application.state.hideTooltip();
      }
    },

    whileElementsMounted(reference, floating, update) {
      return reaction(
        () => reference.getBoundingClientRect(),
        () => {
          computePosition(reference, floating).then(update).catch(console.error);
        },
        {
          fireImmediately: true,
        },
      );
    },
  });

  refs.setReference(application.state.tooltip?.reference ?? null);

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const flexDirectionClassname = {
    top: "flex-col",
    right: "flex-row-reverse",
    bottom: "flex-col-reverse",
    left: "flex-row",
  };

  const arrowRotations = {
    top: "0deg",
    right: "90deg",
    bottom: "180deg",
    left: "270deg",
  };

  const side = placement.split("-")[0] as keyof typeof arrowRotations;

  const { getFloatingProps } = useInteractions([dismiss, role]);
  const floatingProps = getFloatingProps();
  const props = {
    ...floatingProps,
    className: clsx(
      "flex items-center",
      middlewareData.hide?.referenceHidden ? "hidden" : flexDirectionClassname[side],
      floatingProps.className as string | undefined,
    ),
  };

  return (
    <FloatingPortal>
      {application.state.tooltip && (
        <div
          ref={refs.setFloating}
          {...props}
          style={{
            ...floatingStyles,
            fontSize: `${Math.log(-application.canvas.userspaceToCanvasFactor / PX_PER_MM)}px`,
            filter: "drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.3))",
          }}
        >
          <div className="rounded-md bg-gray-800 p-4">{application.state.tooltip.children}</div>
          <svg
            ref={arrowRef}
            className="h-auto max-h-4 fill-gray-800"
            viewBox="0 0 24 10"
            style={{
              transform: `rotate(${arrowRotations[side]})`,
            }}
          >
            <path d="M 0 0 c 12 1 10 10 12 10 C 14 10 12 1 24 0" />
          </svg>
        </div>
      )}
    </FloatingPortal>
  );
});
