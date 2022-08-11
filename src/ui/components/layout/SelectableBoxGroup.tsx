import { observer } from "mobx-react-lite";
import React from "react";
import { useApplicationState } from "../../utils/ApplicationStateContext";
import { BoxGroup, BoxGroupProps } from "./BoxGroup";

export const SelectableBoxGroup = observer((props: BoxGroupProps) => {
  const { selection } = useApplicationState();

  const onClick = (event: MouseEvent) => {
    selection.setFor(props.node);
    props.onClick?.(event);
  };

  return <BoxGroup {...props} onClick={onClick} />;
});
