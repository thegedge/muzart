import React from "react";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { BoxGroup, BoxGroupProps } from "./BoxGroup";

export const Selectable = (props: BoxGroupProps) => {
  const { selection } = useApplicationState();

  const onClick = (event: MouseEvent) => {
    selection.setFor(props.element);
    props.onClick?.(event);
  };

  return <BoxGroup {...props} onClick={onClick} />;
};
