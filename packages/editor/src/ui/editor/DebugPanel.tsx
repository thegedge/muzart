import { type AnyLayoutElement } from "@muzart/layout";
import { observer } from "mobx-react-lite";
import { PropsWithChildren } from "react";
import { useApplicationState } from "../../utils/ApplicationStateContext";

export const DebugPanel = observer((_props: Record<string, never>) => {
  const application = useApplicationState();
  return (
    <div className="debug-panel flex h-full min-w-72 max-w-72 flex-col gap-4 p-4 text-sm">
      <ElementTree element={application.debug.highlightedElement} />
    </div>
  );
});

const ElementTree = (props: { element: AnyLayoutElement | null }) => {
  if (!props.element) {
    return null;
  }

  let component = null;
  let current: AnyLayoutElement | null = props.element;
  while (current) {
    component = (
      <ElementDebug className="pl-4" element={current}>
        {component}
      </ElementDebug>
    );
    current = current.parent;
  }

  return component;
};

const ElementDebug = (props: PropsWithChildren<{ className?: string; element: AnyLayoutElement }>) => {
  return (
    <div className={props.className}>
      {props.element.type}
      {props.children}
    </div>
  );
};
