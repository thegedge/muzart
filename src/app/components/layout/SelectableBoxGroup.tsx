import { observer } from "mobx-react-lite";
import React from "react";
import { useApplicationState } from "../utils/ApplicationStateContext";
import { BoxGroup, BoxGroupProps } from "./BoxGroup";

export const SelectableBoxGroup = observer((props: BoxGroupProps) => {
  const { selection } = useApplicationState();

  let onClick;
  if (props.onClick) {
    onClick = (event: React.MouseEvent<SVGGElement>) => {
      props.onClick!(event);
      selection.setFor(props.node);
    };
  } else {
    onClick = () => selection.setFor(props.node);
  }

  return <BoxGroup {...props} onClick={onClick} />;
});
